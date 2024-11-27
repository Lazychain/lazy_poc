import { CosmosClient, wasmQuery } from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { IndexedTx, JsonObject } from "@cosmjs/cosmwasm-stargate";
import { addPad } from "@shared/utils";
import type { IHypMailbox, IHypMailboxQuery } from "../imailbox";

const logger = new Logger("hpl_mailbox");

export class HypCosmosMailbox implements IHypMailbox, IHypMailboxQuery {
  private client: CosmosClient;
  private address: any;

  constructor(client: CosmosClient, address: string) {
    this.client = client;
    this.address = address;
  }
  async quoteDispatch(
    sender: string,
    recipientAddr: string,
    message: string,
    destDomain: number
  ): Promise<any> {
    const msg = {
      hook: {
        quote_dispatch: {
          sender: sender,
          msg: {
            dest_domain: destDomain,
            recipient_addr: addPad(recipientAddr),
            msg_body: Buffer.from(message, "utf-8").toString("hex"),
          },
        },
      },
    };
    logger.json(msg);
    let res: IndexedTx = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async latestDispathId(): Promise<any> {
    const msg = { mailbox: { latest_dispatch_id: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async nonce(): Promise<any> {
    const msg = { mailbox: { nonce: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }

  async requiredHook(): Promise<any> {
    const msg = { mailbox: { required_hook: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async defaultHook(): Promise<any> {
    const msg = { mailbox: { default_hook: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async hrp(): Promise<any> {
    const msg = { mailbox: { hrp: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async messageDelivered(messageId: string): Promise<any> {
    const msg = { mailbox: { message_delivered: { id: messageId } } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }

  async status() {
    logger.info(`Mailbox [${this.address}] Status: `);
    logger.separator();
    logger.json(await this.hrp());
    logger.json(await this.localDomain());
    logger.json(await this.defaultIsm());
    logger.json(await this.defaultHook());
    logger.json(await this.requiredHook());
    logger.json(await this.nonce());
    // logger.info(await queryMailboxLatestDispathId(cw_client, mailbox_addr)); fail if there no distpacth
    logger.separator();
  }

  async defaultIsm(): Promise<string> {
    const msg = { mailbox: { default_ism: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }

  async localDomain(): Promise<string> {
    const msg = { mailbox: { local_domain: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }

  async recipientIsm(recipientAddr: string): Promise<string> {
    const msg = {
      mailbox: { recipient_ism: { recipient_addr: recipientAddr } },
    };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }

  addr(): string {
    return this.address;
  }
}
