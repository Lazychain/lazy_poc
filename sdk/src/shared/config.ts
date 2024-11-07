import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Secp256k1, keccak256 } from "@cosmjs/crypto";
import {
  DirectSecp256k1HdWallet,
  DirectSecp256k1Wallet,
} from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { readFileSync } from "fs";
import yaml from "js-yaml";

import { Logger } from "./logger";

const logger = new Logger("config");

export type IsmType =
  | {
      type: "multisig";
      owner: string;
      validators: {
        [domain: number]: { addrs: string[]; threshold: number };
      };
    }
  | {
      type: "mock";
    }
  | {
      type: "aggregate";
      owner: string;
      isms: IsmType[];
    }
  | {
      type: "routing";
      owner: string;
      isms: { [domain: number]: IsmType };
    };

export type FeeHookType = {
  type: "fee";
  owner: string;
  fee: {
    denom?: string;
    amount: bigint;
  };
};

export type IgpHookType = {
  type: "igp";
  owner: string;
  token?: string;
  configs: {
    [domain: number]: {
      exchange_rate: number;
      gas_price: number;
    };
  };
  default_gas_usage: number;
};

export type RoutingHookType = {
  type: "routing";
  owner: string;
  hooks: { [domain: number]: HookType };
};

export type RoutingCustomHookType = {
  type: "routing-custom";
  owner: string;
  hooks: { [domain: number]: HookType };
  custom_hooks: {
    [domain: number]: { recipient: string; hook: HookType };
  };
};

export type RoutingFallbackHookType = {
  type: "routing-fallback";
  owner: string;
  hooks: { [domain: number]: HookType };
  fallback_hook: HookType;
};

export type HookType =
  | FeeHookType
  | {
      type: "merkle";
    }
  | {
      type: "mock";
    }
  | {
      type: "pausable";
      owner: string;
      paused: boolean;
    }
  | IgpHookType
  | { type: "aggregate"; owner: string; hooks: HookType[] }
  | RoutingHookType
  | RoutingCustomHookType
  | RoutingFallbackHookType;

export type Config = {
  networks: {
    id: string;
    signer: string;
    hrp: string;
    gas: {
      price: string;
      denom: string;
    };
    domain: number;
    endpoint: {
      rpc: string;
      rest: string;
      grpc: string;
    };
  }[];

  evm_networks: {
    name: string;
    signer: string;
    chain_id: number;
    rpc_endpoint: string;
    network: string;
    native_currency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    mailbox_address: `0x${string}`;
    multisig_ism_factory_address: `0x${string}`;
  }[];

  deploy: {
    ism?: IsmType;
    hooks?: {
      default?: HookType;
      required?: HookType;
    };
  };
};

export class Client {
  wasm: SigningCosmWasmClient;
  stargate: SigningStargateClient;
  signer: string;
  signer_addr: string;
  signer_pubkey: string;

  constructor(
    wasm: SigningCosmWasmClient,
    stargate: SigningStargateClient,
    signer: string,
    signer_addr: string,
    signer_pubkey: string
  ) {
    this.wasm = wasm;
    this.stargate = stargate;
    this.signer = signer;
    this.signer_addr = signer_addr;
    this.signer_pubkey = signer_pubkey;
  }
}

const path = process.env.CONFIG || `${process.cwd()}/config.yaml`;

export const getNetwork = (networkId: string): Config["networks"][number] => {
  const ret = config.networks.find((v) => v.id === networkId);
  if (!ret)
    throw new Error(`Network ${networkId} not found in the config file`);
  return ret;
};

export const config = yaml.load(readFileSync(path, "utf-8")) as Config;

export const getEvmNetwork = (
  networkName: string
): Config["evm_networks"][number] => {
  const ret = config.evm_networks.find((v) => v.name === networkName);
  if (!ret)
    throw new Error(`EVM Network ${networkName} not found in the config file`);
  return ret;
};

export async function getSigningClient(networkId: string): Promise<Client> {
  logger.info(`getSigningClient [${networkId}]`);
  const networkConfig = getNetwork(networkId);

  const { signer, hrp, gas } = networkConfig;

  const endpoint = networkConfig.endpoint;

  logger.info(`endpoint [${JSON.stringify(endpoint, null, "\t")}]`);

  const wallet =
    signer.split(" ").length > 1
      ? await DirectSecp256k1HdWallet.fromMnemonic(signer, { prefix: hrp })
      : await DirectSecp256k1Wallet.fromKey(Buffer.from(signer, "hex"), hrp);

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
    signer: account.address,
    signer_addr: Buffer.from(ethaddr).toString("hex"),
    signer_pubkey: Buffer.from(account.pubkey).toString("hex"),
  };

  logger.info(
    `Signer Addr[${result.signer}] ETH[${result.signer_addr}] PubKey[${result.signer_pubkey}]`
  );

  return result;
}
