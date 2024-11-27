import {
  CosmosClient,
  executeCosmosContract,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";
import type {
  IHypHookFees,
  IHypHookFeesExecute,
  IHypHookFeesQuery,
} from "../ihook_fees";

const logger = new Logger("hpl_hook_fee");

export class HypHookFees
  implements IHypHookFees, IHypHookFeesQuery, IHypHookFeesExecute
{
  private client: CosmosClient;
  private address: any;

  constructor(client: CosmosClient, address: string) {
    this.client = client;
    this.address = address;
  }
  async feeHookQuoteDispatch(metadata: string, message: string): Promise<any> {
    const msg = {
      hook: { quote_dispatch: { metadata: metadata, message: message } },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async claim(recipient: string): Promise<any> {
    const msg = {
      fee_hook: {
        claim: {
          recipient: recipient,
        },
      },
    };

    const res = await executeCosmosContract(
      this.client,
      "hpl_hook_fee",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async setFee(fee_denom: string, fee_amount: number): Promise<any> {
    const msg = {
      fee_hook: {
        set_fee: {
          denom: fee_denom,
          amount: fee_amount,
        },
      },
    };

    const res = await executeCosmosContract(
      this.client,
      "hpl_hook_fee",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async status(): Promise<void> {
    logger.info(`Hook Fee [${this.address}] Status: `);
    logger.separator();
    logger.json(await this.feeHookFees());
    logger.json(await this.feeHookMailbox());
    logger.separator();
  }
  async feeHookFees(): Promise<any> {
    const msg = { fee_hook: { fee: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async feeHookMailbox(): Promise<any> {
    const msg = { hook: { mailbox: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }

  addr(): string {
    return this.address;
  }
}
