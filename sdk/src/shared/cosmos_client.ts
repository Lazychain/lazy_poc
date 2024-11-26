import {
  SigningCosmWasmClient,
  type ExecuteResult,
  type JsonObject,
  type UploadResult,
} from "@cosmjs/cosmwasm-stargate";
import { Secp256k1, keccak256 } from "@cosmjs/crypto";
import { AccessConfig, AccessType } from "cosmjs-types/cosmwasm/wasm/v1/types";
import {
  DirectSecp256k1HdWallet,
  type AccountData,
} from "@cosmjs/proto-signing";
import {
  GasPrice,
  SigningStargateClient,
  type IndexedTx,
} from "@cosmjs/stargate";

import { Logger } from "./logger";
import { getNetwork, type NetworksConfig } from "./config/network";
import { extractByte32AddrFromBech32, sleep, waitTx } from "./utils";
import * as fs from "fs";

const logger = new Logger("cosmos-client");

export class CosmosClient {
  wasm: SigningCosmWasmClient;
  stargate: SigningStargateClient;
  network: NetworksConfig["networks"][number];
  signer: AccountData;
  signer_eth_addr: string;
  signer_pubkey: string;

  constructor(
    wasm: SigningCosmWasmClient,
    stargate: SigningStargateClient,
    networkConfig: NetworksConfig["networks"][number],
    signer: AccountData,
    signer_eth_addr: string,
    signer_pubkey: string
  ) {
    this.wasm = wasm;
    this.stargate = stargate;
    this.signer = signer;
    this.signer_eth_addr = signer_eth_addr;
    this.signer_pubkey = signer_pubkey;
    this.network = networkConfig;
  }
}

// https://gist.github.com/webmaster128/8444d42a7eceeda2544c8a59fbd7e1d9
export async function getCosmosClient(
  networkId: string,
  mnemonic: string
): Promise<CosmosClient> {
  const network = getNetwork(networkId);

  const { hrp, gas } = network;

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: hrp,
  });
  const [signer] = await wallet.getAccounts();
  const gasPrice = GasPrice.fromString(`${gas.price}${gas.denom}`);

  const wasm = await SigningCosmWasmClient.connectWithSigner(
    network.endpoint,
    wallet,
    {
      gasPrice,
    }
  );
  const stargate = await SigningStargateClient.connectWithSigner(
    network.endpoint,
    wallet,
    { gasPrice }
  );

  const pubkey = Secp256k1.uncompressPubkey(signer.pubkey);
  const ethaddr = keccak256(pubkey.slice(1)).slice(-20);

  const result = {
    wasm,
    stargate,
    network,
    signer,
    signer_eth_addr: Buffer.from(ethaddr).toString("hex"),
    signer_pubkey: Buffer.from(signer.pubkey).toString("hex"),
  };

  logger.success(
    `Signer Addr[${result.signer.address}] ETH[${result.signer_eth_addr}] PubKey[${result.signer_pubkey}]`
  );

  return result;
}

export async function instantiateCosmosContract(
  client: CosmosClient,
  contractName: string,
  codeId: number,
  initMsg: object
): Promise<{ type: string; address: string; hexed: string }> {
  const { wasm, stargate, signer } = client;

  const res = await wasm.instantiate(
    signer.address,
    codeId,
    initMsg,
    contractName,
    "auto"
  );
  const receipt = await waitTx(res.transactionHash, stargate);

  if (receipt.code > 0) {
    logger.failure(
      "instantiate tx failed.",
      `contract=${contractName}, hash=${receipt.hash}`
    );
    throw new Error(JSON.stringify(receipt.events, null, 2));
  }

  logger.success(
    `I ${contractName}: ${JSON.stringify(initMsg, null, 2)} -> [${
      res.contractAddress
    }]`
  );
  return {
    type: contractName,
    address: res.contractAddress,
    hexed: extractByte32AddrFromBech32(res.contractAddress),
  };
}

export async function executeCosmosContract(
  { wasm, stargate, signer: account }: CosmosClient,
  contractName: string,
  contractAddress: string,
  msg: object,
  funds: { amount: string; denom: string }[] = []
): Promise<IndexedTx> {
  logger.info(`EXECUTING ${contractName}`);
  const res: ExecuteResult = await wasm.execute(
    account.address,
    contractAddress,
    msg,
    "auto",
    "test",
    funds
  );

  const receipt = await waitTx(res.transactionHash, stargate);
  if (receipt.code > 0) {
    logger.error(
      "execute tx failed.",
      `contract=${contractName}, hash=${receipt.hash}`
    );
    throw new Error(JSON.stringify(receipt.events));
  }

  logger.success(`Execute [${contractName}]: Tx[${receipt.hash}].`);

  return receipt;
}

export async function executeCosmosMultiMsg(
  { wasm, stargate, signer }: CosmosClient,
  msgs: { contractName: string; contractAddress: string; msg: object }[]
): Promise<IndexedTx> {
  msgs.map((v) => logger.json(JSON.stringify(v, null, 2)));

  const res = await wasm.executeMultiple(
    signer.address,
    msgs.map((v) => ({
      contractAddress: v.contractAddress,
      msg: v.msg,
    })),
    "auto"
  );
  const receipt: IndexedTx = await waitTx(res.transactionHash, stargate);
  if (receipt.code > 0) {
    logger.error(
      `execute multiple tx failed.`,
      `msgs=${msgs.length}, hash=${receipt.hash}`
    );
    throw new Error(JSON.stringify(receipt.events, null, 2));
  }

  msgs.forEach((element) => {
    logger.json(
      `XMS [${element.contractName}] MSG[${JSON.stringify(
        element.msg,
        null,
        2
      )}]`
    );
  });

  logger.info(`X -> [${JSON.stringify(receipt.events, null, 2)}]`);

  return receipt;
}

export async function wasmQuery(
  { wasm }: CosmosClient,
  contractAddress: string,
  queryMsg: JsonObject
): Promise<IndexedTx> {
  return await wasm.queryContractSmart(contractAddress, queryMsg);
}

export async function upload(
  client: CosmosClient,
  contract_name: string
): Promise<number> {
  // const restrictedInstantiationPermissions: AccessConfig = {
  //   permission: AccessType.ACCESS_TYPE_ANY_OF_ADDRESSES,
  //   address: "", //
  //   addresses: [client.signer_addr],
  // };

  const contract_path = "./artifacts/" + contract_name + ".wasm";
  const contract_bytes: Uint8Array = fs.readFileSync(contract_path);
  const upload: UploadResult = await client.wasm.upload(
    client.signer.address,
    contract_bytes,
    "auto",
    undefined,
    undefined
  );

  const receipt: IndexedTx = await waitTx(
    upload.transactionHash,
    client.stargate
  );

  if (receipt.code > 0) {
    logger.failure(`tx: ${upload.transactionHash}`);
  }

  logger.success(`codeId: ${upload.codeId}, tx: ${upload.transactionHash}`);
  return upload.codeId;
}
