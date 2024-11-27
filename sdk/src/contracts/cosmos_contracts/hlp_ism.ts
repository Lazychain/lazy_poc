import { CosmosClient } from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { IHypIsm, IHypIsmQuery } from "../iism";

const logger = new Logger("hpl_ism");

export class HypCosmosIsm implements IHypIsm, IHypIsmQuery {
  private client: CosmosClient;
  private address: any;

  constructor(client: CosmosClient, address: string) {
    this.client = client;
    this.address = address;
  }

  getSignerAddress(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  addr(): string {
    return this.address;
  }
}
