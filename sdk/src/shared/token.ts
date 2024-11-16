import { readFileSync } from "fs";
import yaml from "js-yaml";

const path = `${process.cwd()}/token.yaml`;
export const tokenList = yaml.load(readFileSync(path, "utf-8")) as TokenList;

export type TokenList<
  TokenType extends "native" | "cw20" = "native" | "cw20",
  TokenMode extends "bridged" | "collateral" = "bridged" | "collateral"
> = {
  tokens: {
    id: string;
    protocol: string;
    type: string;
    mode: string;
    config: WarpTokenConfigMap[TokenType][TokenMode];
  }[];
};

export const getToken = (networkId: string): TokenList["tokens"][number] => {
  const ret = tokenList.tokens.find((v) => v.id === networkId);
  if (!ret)
    throw new Error(`Network ${networkId} not found in the config file`);
  return ret;
};

type NativeTokenBridged = {
  denom: string;
  metadata?: {
    description: string;
    denom_units: {
      denom: string;
      exponent: string;
      aliases: string[];
    }[];
    base: string;
    display: string;
    name: string;
    symbol: string;
  };
};

type NativeTokenCollateral = {
  denom: string;
};

type Cw20TokenBridged = {
  code_id: number;
  init_msg: {
    name: string;
    symbol: string;
    decimals: number;
    initial_balances: { address: string; amount: string }[];
    mint?: { minter: string; cap?: string };
    marketing?: {
      project?: string;
      description?: string;
      marketing?: string;
      logo?: { url: string } & {
        embedded: { svg: string } & { png: string };
      };
    };
  };
};

type Cw20TokenCollateral = {
  address: string;
};

type WarpTokenConfigMap = {
  native: {
    bridged: { bridged: NativeTokenBridged };
    collateral: { collateral: NativeTokenCollateral };
  };
  cw20: {
    bridged: { bridged: Cw20TokenBridged };
    collateral: { collateral: Cw20TokenCollateral };
  };
};
