import { readFileSync } from "fs";
import yaml from "js-yaml";

const path = `${process.cwd()}/config.yaml`;
export const config = yaml.load(readFileSync(path, "utf-8")) as Config;

export type Config = {
  networks: {
    id: string;
    hrp: string;
    protocol: string;
    gas: {
      price: string;
      denom: string;
    };
    domain: number;
    endpoint: {
      jsonrpc: string;
      rpc: string;
      rest: string;
      grpc: string;
    };
    network: string;
    native_currency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    mailbox_address: `0x${string}`;
    multisig_ism_factory_address: `0x${string}`;
  }[];
};

export const getNetwork = (networkId: string): Config["networks"][number] => {
  const ret = config.networks.find((v) => v.id === networkId);
  if (!ret)
    throw new Error(`Network ${networkId} not found in the config file`);
  return ret;
};
