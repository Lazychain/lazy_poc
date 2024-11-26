import { readFileSync } from "fs";
import yaml from "js-yaml";

const path = `${process.cwd()}/config.yaml`;
export const config = yaml.load(readFileSync(path, "utf-8")) as ContractsConfig;

export type ContractsConfig = {
  contracts: CustomContract[];
};

export type CustomContract = {
  id: string;
  abi: string;
  bin: string;
};

export const getContract = (
  contractId: string
): ContractsConfig["contracts"][number] => {
  const ret = config.contracts.find((v: CustomContract) => v.id === contractId);
  if (!ret)
    throw new Error(`contract ${contractId} not found in the config file`);
  return ret;
};
