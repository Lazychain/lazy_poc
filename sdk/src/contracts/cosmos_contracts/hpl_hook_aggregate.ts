import {
  CosmosClient,
  executeCosmosContract,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";
import type {
  IHypHookAggregate,
  IHypHookAggregateExecute,
  IHypHookAggregateQuery,
} from "../ihook_aggregate";

const logger = new Logger("hpl_hook_aggregate");

export class HypHookAggregate
  implements
    IHypHookAggregate,
    IHypHookAggregateQuery,
    IHypHookAggregateExecute
{
  private client: CosmosClient;
  private address: any;

  constructor(client: CosmosClient, address: string) {
    this.client = client;
    this.address = address;
  }
  addr(): string {
    return this.address;
  }

  async setHooks(hooks: string[]): Promise<any> {
    const msg = {
      set_hooks: {
        hooks: hooks,
      },
    };

    const res = await executeCosmosContract(
      this.client,
      "hpl_hook_aggregate",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async status(): Promise<void> {
    logger.info(`Aggregate Hook [${this.address}] Status: `);
    logger.separator();
    logger.json(await this.hooks());
    logger.json(await this.mailbox());
    logger.separator();
  }
  async hooks(): Promise<any> {
    const msg = { aggregate_hook: { hooks: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async mailbox(): Promise<any> {
    const msg = { hook: { mailbox: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
}
