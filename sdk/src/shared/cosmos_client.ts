import {
  SigningCosmWasmClient,
  type JsonObject,
} from "@cosmjs/cosmwasm-stargate";
import { Secp256k1, keccak256 } from "@cosmjs/crypto";
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
import { getNetwork, type Config } from "./config";
import { extractByte32AddrFromBech32, sleep, waitTx } from "./utils";

const logger = new Logger("config");

export class CosmosClient {
  wasm: SigningCosmWasmClient;
  stargate: SigningStargateClient;
  network: Config["networks"][number];
  account: AccountData;
  signer_addr: string;
  signer_pubkey: string;

  constructor(
    wasm: SigningCosmWasmClient,
    stargate: SigningStargateClient,
    networkConfig: Config["networks"][number],
    signer: AccountData,
    signer_addr: string,
    signer_pubkey: string
  ) {
    this.wasm = wasm;
    this.stargate = stargate;
    this.account = signer;
    this.signer_addr = signer_addr;
    this.signer_pubkey = signer_pubkey;
    this.network = networkConfig;
  }
}

export async function getCosmosClient(
  networkId: string,
  mnemonic: string
): Promise<CosmosClient> {
  logger.info(`getSigningClient [${networkId}]`);
  const network = getNetwork(networkId);

  const { hrp, gas } = network;

  const endpoint = network.endpoint;

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: hrp,
  });
  const [account] = await wallet.getAccounts();
  const gasPrice = GasPrice.fromString(`${gas.price}${gas.denom}`);

  const wasm = await SigningCosmWasmClient.connectWithSigner(
    endpoint.rpc,
    wallet,
    { gasPrice }
  );
  const stargate = await SigningStargateClient.connectWithSigner(
    endpoint.rpc,
    wallet,
    { gasPrice }
  );

  const pubkey = Secp256k1.uncompressPubkey(account.pubkey);
  const ethaddr = keccak256(pubkey.slice(1)).slice(-20);

  const result = {
    wasm,
    stargate,
    network,
    account,
    signer_addr: Buffer.from(ethaddr).toString("hex"),
    signer_pubkey: Buffer.from(account.pubkey).toString("hex"),
  };

  logger.info(
    `Signer Addr[${result.account.address}] ETH[${result.signer_addr}] PubKey[${result.signer_pubkey}]`
  );

  return result;
}

export async function deployCosmosContract(
  client: CosmosClient,
  contractName: string,
  codeId: number,
  initMsg: object,
  retryAfter = 1000
): Promise<{ type: string; address: string; hexed: string }> {
  const { wasm, stargate, signer_addr } = client;

  try {
    const res = await wasm.instantiate(
      signer_addr,
      codeId,
      initMsg,
      `cw-hpl: ${contractName}`,
      "auto"
    );
    const receipt = await waitTx(res.transactionHash, stargate);
    if (receipt.code > 0) {
      logger.error(
        "deploy tx failed.",
        `contract=${contractName}, hash=${receipt.hash}`
      );
      throw new Error(JSON.stringify(receipt.events, null, 2));
    }

    logger.json(
      `I ${contractName}: ${JSON.stringify(initMsg, null, 2)} -> [${
        res.contractAddress
      }]`
    );
    return {
      type: contractName,
      address: res.contractAddress,
      hexed: extractByte32AddrFromBech32(res.contractAddress),
    };
  } catch (e) {
    logger.error(`failed to deploy contract. retrying after ${retryAfter}ms`);
    logger.error("=> error: ", e);
    await sleep(retryAfter);
    return deployCosmosContract(
      client,
      contractName,
      codeId,
      initMsg,
      retryAfter * 2
    );
  }
}

export async function executeCosmosContract(
  { wasm, stargate, signer_addr, account }: CosmosClient,
  contractName: string,
  contractAddress: string,
  msg: object,
  funds: { amount: string; denom: string }[] = []
): Promise<IndexedTx> {
  logger.info(`senderAddress=${account.address}`);
  const res = await wasm.execute(
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

  logger.json(
    `X ${contractName}: ${JSON.stringify(msg, null, 2)} -> [${receipt}]`
  );

  return receipt;
}

export async function executeCosmosMultiMsg(
  { wasm, stargate, signer_addr }: CosmosClient,
  msgs: { contractName: string; contractAddress: string; msg: object }[]
): Promise<IndexedTx> {
  msgs.map((v) => logger.json(JSON.stringify(v, null, 2)));

  const res = await wasm.executeMultiple(
    signer_addr,
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
