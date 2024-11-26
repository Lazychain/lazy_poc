import {
  CosmosClient,
  executeCosmosContract,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";

const logger = new Logger("hpl_hook_fee");

export async function setFee(
  client: CosmosClient,
  contractAddr: string,
  fee_denom: string,
  fee_amount: number
) {
  const msg = {
    fee_hook: {
      set_fee: {
        denom: fee_denom,
        amount: fee_amount,
      },
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_hook_fee",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function Claim(
  client: CosmosClient,
  contractAddr: string,
  recipient: string
) {
  const msg = {
    fee_hook: {
      claim: {
        recipient: recipient,
      },
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_hook_fee",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function queryFeeHookStatus(
  cw_client: CosmosClient,
  fee_addr: string | undefined
) {
  if (fee_addr !== undefined) {
    logger.info(`Hook Fee [${fee_addr}] Status: `);
    logger.separator();
    logger.json(await queryFeeHookFees(cw_client, fee_addr));
    logger.json(await queryFeeHookMailbox(cw_client, fee_addr));
    logger.separator();
  }
}

export async function queryFeeHookFees(
  cw_client: CosmosClient,
  fee_addr: string
) {
  const msg = { fee_hook: { fee: {} } };
  let res: JsonObject = await wasmQuery(cw_client, fee_addr, msg);
  return res;
}

export async function queryFeeHookMailbox(
  cw_client: CosmosClient,
  fee_addr: string
) {
  const msg = { hook: { mailbox: {} } };
  let res: JsonObject = await wasmQuery(cw_client, fee_addr, msg);
  return res;
}

export async function queryFeeHookQuoteDispatch(
  cw_client: CosmosClient,
  fee_addr: string,
  metadata: string,
  message: string
) {
  const msg = {
    hook: { quote_dispatch: { metadata: metadata, message: message } },
  };
  let res: JsonObject = await wasmQuery(cw_client, fee_addr, msg);
  return res;
}
