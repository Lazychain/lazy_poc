import {
  CosmosClient,
  executeCosmosContract,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";

const logger = new Logger("hpl_igp");

export async function queryIGPStatus(
  cw_client: CosmosClient,
  igp_addr: string | undefined
) {
  if (igp_addr !== undefined) {
    logger.info(`IGP [${igp_addr}] Status: `);
    logger.separator();
    logger.json(await queryIGPOwnable(cw_client, igp_addr));
    logger.json(await queryIGPRouterDomains(cw_client, igp_addr));
    logger.json(await queryIGPRouterListRoutes(cw_client, igp_addr));
    logger.json(await queryIGPMailbox(cw_client, igp_addr));
    logger.json(await queryIGPDefaultGasPrice(cw_client, igp_addr));
    logger.json(await queryIGPListGasForDomains(cw_client, igp_addr));
    logger.json(await queryIGPBeneficiary(cw_client, igp_addr));
    logger.separator();
  } else {
    logger.notice("igp address is empty.");
  }
}

export async function queryIGPOwnable(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = { ownable: { get_owner: {} } };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPRouterDomains(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = { router: { domains: {} } };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPRouterListRoutes(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = { router: { list_routes: {} } };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPMailbox(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = { hook: { mailbox: {} } };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPDefaultGasPrice(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = {
    igp: {
      default_gas: {},
    },
  };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPListGasForDomains(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = {
    igp: {
      list_gas_for_domains: {},
    },
  };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPBeneficiary(
  cw_client: CosmosClient,
  igp_addr: string
) {
  const msg = {
    igp: {
      beneficiary: {},
    },
  };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPQuoteGasPayment(
  cw_client: CosmosClient,
  igp_addr: string,
  destination_domain: string,
  gas_amount: number
) {
  const msg = {
    igp: {
      quote_gas_payment: {
        dest_domain: destination_domain,
        gas_amount: gas_amount,
      },
    },
  };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPGasForDomain(
  cw_client: CosmosClient,
  igp_addr: string,
  domains: string[]
) {
  const msg = {
    igp: {
      gas_for_domain: { domains: domains },
    },
  };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}

export async function queryIGPOracleExchangeRateAndGasPrice(
  cw_client: CosmosClient,
  igp_addr: string | undefined,
  destination_domain: number
) {
  if (igp_addr !== undefined) {
    const msg = {
      oracle: {
        get_exchange_rate_and_gas_price: { dest_domain: destination_domain },
      },
    };
    let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
    return res;
  } else {
    logger.notice("igp address is empty.");
  }
}
