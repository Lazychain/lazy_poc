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
    endpoint: string;
    network: string;
    native_currency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }[];
  bridges: Bridge[];
};

type Bridge = {
  id: string;
  lazy: BridgeMap;
  stargaze: BridgeMap;
  forma: BridgeMap;
};

type BridgeMap = {
  domainRoutingIsmFactory: `0x${string}`;
  interchainAccountIsm: `0x${string}`;
  interchainAccountRouter: `0x${string}`;
  mailbox: `0x${string}`;
  merkleTreeHook: `0x${string}`;
  proxyAdmin: `0x${string}`;
  staticAggregationHookFactory: `0x${string}`;
  staticAggregationIsmFactory: `0x${string}`;
  staticMerkleRootMultisigIsmFactory: `0x${string}`;
  staticMerkleRootWeightedMultisigIsmFactory: `0x${string}`;
  staticMessageIdMultisigIsmFactory: `0x${string}`;
  staticMessageIdWeightedMultisigIsmFactory: `0x${string}`;
  testRecipient: `0x${string}`;
  validatorAnnounce: `0x${string}`;
  mailbox_cosmos?: string;
  validator_announce_cosmos?: string;
};

export const getNetwork = (networkId: string): Config["networks"][number] => {
  const ret = config.networks.find((v) => v.id === networkId);
  if (!ret)
    throw new Error(`Network ${networkId} not found in the config file`);
  return ret;
};

export const getBridge = (bridgeId: string): Config["bridges"][number] => {
  const ret = config.bridges.find((v) => v.id === bridgeId);
  if (!ret) throw new Error(`Bridge ${bridgeId} not found in the config file`);
  return ret;
};
