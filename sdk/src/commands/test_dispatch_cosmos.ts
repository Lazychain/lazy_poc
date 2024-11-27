import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { coin } from "@cosmjs/stargate";
import {
  executeCosmosContract,
  getCosmosClient,
  type CosmosClient,
} from "@shared/cosmos_client";
import { addPad } from "@shared/utils";
import type { IndexedTx } from "@cosmjs/cosmwasm-stargate";

import { getNetwork, type NetworksConfig } from "@shared/config/network";
import { getBridge, type BridgesConfig } from "@shared/config/bridge";
import { HypCosmosMailbox } from "@cw_contracts/hlp_mailbox";
import { HypHookFees } from "@cw_contracts/hlp_hook_fee";
import { HypHookAggregate } from "@cw_contracts/hpl_hook_aggregate";
import { HypIgp } from "@cw_contracts/hpl_igp";

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
    const stargaze: NetworksConfig["networks"][number] = getNetwork(CHAIN_B);
    const lazy: NetworksConfig["networks"][number] = getNetwork(CHAIN_A);
    const bridge: BridgesConfig["bridges"][number] = getBridge(BRIDGE_ID);

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

    const mailbox: HypCosmosMailbox = new HypCosmosMailbox(
      cw_client,
      bridge.stargaze.mailbox
    );
    const hookFees: HypHookFees = new HypHookFees(
      cw_client,
      bridge.stargaze.hpl_hook_fee!
    );
    const hookAggregate: HypHookAggregate = new HypHookAggregate(
      cw_client,
      bridge.stargaze.hpl_hook_aggregate!
    );

    const igp: HypIgp = new HypIgp(cw_client, bridge.stargaze.hpl_igp!);
    await mailbox.status();
    await hookAggregate.status();
    await hookFees.status();
    await igp.status();

    logger.json(
      await mailbox.quoteDispatch(
        cw_client.signer.address,
        recipientAddr,
        TEST_MSG,
        ETH_CHAIN_DOMAIN
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
