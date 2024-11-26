import { CosmosClient, wasmQuery } from "@shared/cosmos_client";
import { Logger } from "../shared/logger";
import type { IndexedTx, JsonObject } from "@cosmjs/cosmwasm-stargate";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";

const logger = new Logger("hpl_mailbox");

export async function queryMailboxStatus(
  cw_client: CosmosClient,
  mailbox_addr: string | undefined
) {
  if (mailbox_addr !== undefined) {
    logger.info(`Mailbox [${mailbox_addr}] Status: `);
    logger.separator();
    logger.json(await queryMailboxHrp(cw_client, mailbox_addr));
    logger.json(await queryMailboxLocalDomain(cw_client, mailbox_addr));
    logger.json(await queryMailboxDefaultIsm(cw_client, mailbox_addr));
    logger.json(await queryMailboxDefaultHook(cw_client, mailbox_addr));
    logger.json(await queryMailboxRequiredHook(cw_client, mailbox_addr));
    logger.json(await queryMailboxNonce(cw_client, mailbox_addr));
    // logger.info(await queryMailboxLatestDispathId(cw_client, mailbox_addr)); fail if there no distpacth
    logger.separator();
  }
}

export async function queryMailboxMessageDelivered(
  cw_client: CosmosClient,
  mailbox_addr: string,
  message_id: string
) {
  const msg = { mailbox: { message_delivered: { id: message_id } } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxHrp(
  cw_client: CosmosClient,
  mailbox_addr: string
) {
  const msg = { mailbox: { hrp: {} } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxLocalDomain(
  cw_client: CosmosClient,
  mailbox_addr: string
) {
  const msg = { mailbox: { local_domain: {} } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxDefaultIsm(
  cw_client: CosmosClient,
  mailbox_addr: string
) {
  const msg = { mailbox: { default_ism: {} } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxRecipientIsm(
  cw_client: CosmosClient,
  mailbox_addr: string | undefined,
  recipient_addr: string
) {
  if (mailbox_addr !== undefined) {
    const msg = {
      mailbox: { recipient_ism: { recipient_addr: recipient_addr } },
    };
    let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
    return res;
  }
}

export async function queryMailboxDefaultHook(
  cw_client: CosmosClient,
  mailbox_addr: string
) {
  const msg = { mailbox: { default_hook: {} } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxRequiredHook(
  cw_client: CosmosClient,
  mailbox_addr: string
) {
  const msg = { mailbox: { required_hook: {} } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxNonce(
  cw_client: CosmosClient,
  mailbox_addr: string
) {
  const msg = { mailbox: { nonce: {} } };
  let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
  return res;
}

export async function queryMailboxLatestDispathId(
  cw_client: CosmosClient,
  mailbox_addr: string | undefined
) {
  if (mailbox_addr !== undefined) {
    const msg = { mailbox: { latest_dispatch_id: {} } };
    let res: JsonObject = await wasmQuery(cw_client, mailbox_addr, msg);
    return res;
  }
}

export async function queryMailboxQuoteDispatch(
  cw_client: CosmosClient,
  mailbox_addr: string | undefined,
  sender: string,
  recipientAddr: string,
  message: string
): Promise<IndexedTx | undefined> {
  if (mailbox_addr !== undefined) {
    const msg = {
      hook: {
        quote_dispatch: {
          sender: sender,
          msg: {
            dest_domain: 11820,
            recipient_addr: addPad(recipientAddr),
            msg_body: Buffer.from(message, "utf-8").toString("hex"),
          },
        },
      },
    };
    logger.json(msg);
    let res: IndexedTx = await wasmQuery(cw_client, mailbox_addr, msg);
    return res;
  }
}
