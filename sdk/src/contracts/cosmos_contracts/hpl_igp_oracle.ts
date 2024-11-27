import { CosmosClient, wasmQuery } from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";

const logger = new Logger("hpl_igp_oracle");

export async function queryIGPOracleStatus(
  cw_client: CosmosClient,
  igp_addr: string | undefined
) {
  if (igp_addr !== undefined) {
    logger.info(`IGP Oracle [${igp_addr}] Status: `);
    logger.separator();
    logger.separator();
  }
}

export async function queryIGPOracleOracleExchangeRateAndGasPrice(
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
    logger.notice("igp oracle address is empty.");
  }
}
