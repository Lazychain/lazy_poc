import { CosmosClient, wasmQuery } from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";
import { queryAggregateHookHooks } from "./hpl_hook_aggregate";

const logger = new Logger("hpl_test_mock_msg_receiver");

export async function queryTestMockMsgReceiverStatus(
  cw_client: CosmosClient,
  hpl_test_mock_msg_receiver_addr: string | undefined
) {
  if (hpl_test_mock_msg_receiver_addr !== undefined) {
    logger.info(
      `TestMockMsgReceiver [${hpl_test_mock_msg_receiver_addr}] Status: `
    );
    logger.separator();
    logger.json(
      await queryAggregateHookHooks(cw_client, hpl_test_mock_msg_receiver_addr)
    );
    logger.separator();
  }
}

export async function queryIGPOracleOracleExchangeRateAndGasPrice(
  cw_client: CosmosClient,
  igp_addr: string,
  destination_domain: number
) {
  const msg = {
    oracle: {
      get_exchange_rate_and_gas_price: { dest_domain: destination_domain },
    },
  };
  let res: JsonObject = await wasmQuery(cw_client, igp_addr, msg);
  return res;
}
