import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { coin, coins } from "@cosmjs/stargate";
import {
  executeCosmosContract,
  getCosmosClient,
  wasmQuery,
  type CosmosClient,
} from "@shared/cosmos_client";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";
import type { IndexedTx, JsonObject } from "@cosmjs/cosmwasm-stargate";
import { getBridge, getNetwork, type Config } from "@shared/config";
import {
  queryMailboxDefaultHook,
  queryMailboxQuoteDispatch,
  queryMailboxStatus,
} from "../cosmos_contracts/hlp_mailbox";
import { queryStatus } from "../cosmos_contracts/hpl_warp_native";
import { queryAggregateHookStatus } from "../cosmos_contracts/hpl_hook_aggregate";
import {
  queryFeeHookQuoteDispatch,
  queryFeeHookStatus,
} from "../cosmos_contracts/hlp_hook_fee";
import { queryIGPStatus } from "../cosmos_contracts/hpl_igp";

colors.enable();
const logger = new Logger("test-dispatch-cosmos");

const BRIDGE_ID = "lazy_stargaze";
const CHAIN_A = "lazy";
const CHAIN_B = "stargaze";
export const ETH_CHAIN_DOMAIN = 11820; // lazy
const TEST_MSG = "hello";

export const testDispatchCosmosCmd = new Command("test-dispatch-cosmos")
  .description("stargaze->lazychain")
  .configureHelp({
    showGlobalOptions: true,
  })
  .argument("recipient-addr")
  .argument("<networkId>", "network Id")
  .argument("<mnemonic>", "mnemonic")
  .action(async (recipientAddr, networkId, mnemonic) => {
    console.log(`${recipientAddr}`);
    console.log(`${networkId}`);
    console.log(`${mnemonic}`);

    const cw_client: CosmosClient = await getCosmosClient(CHAIN_B, mnemonic);
    const stargaze: Config["networks"][number] = getNetwork(CHAIN_B);
    const lazy: Config["networks"][number] = getNetwork(CHAIN_A);
    const bridge: Config["bridges"][number] = getBridge(BRIDGE_ID);

    // should this be on aart or ustars?
    //const funds = coins(10000000, client.network.gas.denom);
    const funds = [
      coin(500000, stargaze.gas.denom),
      //coin(1000, stargaze.gas.denom),
    ];
    console.log(`${JSON.stringify(funds)}`);
    console.log(`receipt[${recipientAddr}]`);
    console.log(`destDomain[${ETH_CHAIN_DOMAIN}]`);
    console.log(`mailbox[${bridge.stargaze.mailbox}]`);

    await queryMailboxStatus(cw_client, bridge.stargaze.mailbox);
    await queryAggregateHookStatus(
      cw_client,
      bridge.stargaze.hpl_hook_aggregate
    );
    await queryFeeHookStatus(cw_client, bridge.stargaze.hpl_hook_fee);
    await queryIGPStatus(cw_client, bridge.stargaze.hpl_igp);

    logger.json(
      await queryMailboxQuoteDispatch(
        cw_client,
        bridge.stargaze.mailbox,
        cw_client.signer.address,
        recipientAddr,
        TEST_MSG
      )
    );

    // logger.json(
    //   await queryFeeHookQuoteDispatch(cw_client, bridge.stargaze.hpl_hook_fee)
    // );

    const msg = {
      dispatch: {
        dest_domain: ETH_CHAIN_DOMAIN,
        recipient_addr: addPad(recipientAddr),
        msg_body: Buffer.from(TEST_MSG, "utf-8").toString("hex"),
      },
    };
    console.log(JSON.stringify(msg, null, 2));
    console.log(`funds: ${JSON.stringify(funds, null, 2)}`);
    let res2: IndexedTx = await executeCosmosContract(
      cw_client,
      "mailbox",
      bridge.stargaze.mailbox,
      msg,
      funds
    );

    logger.json(res2.events);
  });
