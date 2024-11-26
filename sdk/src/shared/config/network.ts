import { readFileSync } from "fs";
import yaml from "js-yaml";

const path = `${process.cwd()}/config.yaml`;
export const config = yaml.load(readFileSync(path, "utf-8")) as NetworksConfig;

export type NetworksConfig = {
  networks: {
    id: string;
    hrp: string;
    protocol: string;
    gas: {
      price: string;
      denom: string;
    };
    domain: number;
    endpoint: string;
    network: string;
    native_currency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }[];
};

export const getNetwork = (
  networkId: string
): NetworksConfig["networks"][number] => {
  const ret = config.networks.find((v) => v.id === networkId);
  if (!ret)
    throw new Error(`Network ${networkId} not found in the config file`);
  return ret;
};
