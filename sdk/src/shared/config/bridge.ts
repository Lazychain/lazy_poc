import { readFileSync } from "fs";
import yaml from "js-yaml";

const path = `${process.cwd()}/bridge.yaml`;
export const config = yaml.load(readFileSync(path, "utf-8")) as BridgesConfig;

export type BridgesConfig = {
  bridges: Bridge[];
};

type Bridge = {
  id: string;
  lazy: BridgeMap;
  stargaze: BridgeMap;
  forma: BridgeMap;
};

type BridgeMap = {
  domainRoutingIsmFactory: string;
  interchainAccountIsm: string;
  interchainAccountRouter: string;
  mailbox: string;
  merkleTreeHook: string;
  proxyAdmin: string;
  staticAggregationHookFactory: string;
  staticAggregationIsmFactory: string;
  staticMerkleRootMultisigIsmFactory: string;
  staticMerkleRootWeightedMultisigIsmFactory: string;
  staticMessageIdMultisigIsmFactory: string;
  staticMessageIdWeightedMultisigIsmFactory: string;
  testRecipient: string;
  validatorAnnounce: string;
  validator_announce?: string;
  hpl_hook_aggregate?: string;
  hpl_hook_fee?: string;
  hpl_hook_merkle?: string;
  hpl_igp?: string;
  hpl_igp_oracle?: string;
  hpl_ism_multisig?: string;
};

export const getBridge = (
  bridgeId: string
): BridgesConfig["bridges"][number] => {
  const ret = config.bridges.find((v: Bridge) => v.id === bridgeId);
  if (!ret) throw new Error(`Bridge ${bridgeId} not found in the config file`);
  return ret;
};
