import { CosmosClient, wasmQuery } from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";
import type { IHypIgp, IHypIgpExecute, IHypIgpQuery } from "../iigp";

const logger = new Logger("hpl_igp");

export class HypIgp implements IHypIgp, IHypIgpQuery, IHypIgpExecute {
  private client: CosmosClient;
  private address: any;

  constructor(client: CosmosClient, address: string) {
    this.client = client;
    this.address = address;
  }
  async status(): Promise<void> {
    logger.info(`IGP [${this.address}] Status: `);
    logger.separator();
    logger.json(await this.ownable());
    logger.json(await this.routerDomains());
    logger.json(await this.routerListRoutes());
    logger.json(await this.mailbox());
    logger.json(await this.defaultGasPrice());
    logger.json(await this.listGasForDomains());
    logger.json(await this.beneficiary());
    logger.separator();
  }
  async ownable(): Promise<any> {
    const msg = { ownable: { get_owner: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async routerDomains(): Promise<any> {
    const msg = { router: { domains: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async routerListRoutes(): Promise<any> {
    const msg = { router: { list_routes: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async mailbox(): Promise<any> {
    const msg = { hook: { mailbox: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async defaultGasPrice(): Promise<any> {
    const msg = {
      igp: {
        default_gas: {},
      },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async listGasForDomains(): Promise<any> {
    const msg = {
      igp: {
        list_gas_for_domains: {},
      },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async beneficiary(): Promise<any> {
    const msg = {
      igp: {
        beneficiary: {},
      },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async quoteGasPayment(
    destination_domain: string,
    gas_amount: number
  ): Promise<any> {
    const msg = {
      igp: {
        quote_gas_payment: {
          dest_domain: destination_domain,
          gas_amount: gas_amount,
        },
      },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async gasForDomain(domains: string[]): Promise<any> {
    const msg = {
      igp: {
        gas_for_domain: { domains: domains },
      },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async oracleExchangeRateAndGasPrice(
    destination_domain: number
  ): Promise<any> {
    const msg = {
      oracle: {
        get_exchange_rate_and_gas_price: { dest_domain: destination_domain },
      },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  addr(): string {
    return this.address;
  }
}
