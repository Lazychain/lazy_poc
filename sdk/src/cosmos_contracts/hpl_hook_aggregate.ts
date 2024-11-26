import {
  CosmosClient,
  executeCosmosContract,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";

const logger = new Logger("hpl_hook_aggregate");

export async function setHooks(
  client: CosmosClient,
  contractAddr: string,
  hooks: string[]
) {
  const msg = {
    set_hooks: {
      hooks: hooks,
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_hook_aggregate",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function queryAggregateHookStatus(
  cw_client: CosmosClient,
  aggregate_hook_addr: string | undefined
) {
  if (aggregate_hook_addr !== undefined) {
    logger.info(`Aggregate Hook [${aggregate_hook_addr}] Status: `);
    logger.separator();
    logger.json(await queryAggregateHookHooks(cw_client, aggregate_hook_addr));
    logger.json(
      await queryAggregateHookMailbox(cw_client, aggregate_hook_addr)
    );
    logger.separator();
  }
}

export async function queryAggregateHookHooks(
  cw_client: CosmosClient,
  aggregate_hook_addr: string
) {
  const msg = { aggregate_hook: { hooks: {} } };
  let res: JsonObject = await wasmQuery(cw_client, aggregate_hook_addr, msg);
  return res;
}

export async function queryAggregateHookMailbox(
  cw_client: CosmosClient,
  aggregate_hook_addr: string
) {
  const msg = { hook: { mailbox: {} } };
  let res: JsonObject = await wasmQuery(cw_client, aggregate_hook_addr, msg);
  return res;
}
