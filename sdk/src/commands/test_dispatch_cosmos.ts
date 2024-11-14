import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { coins } from "@cosmjs/stargate";
import {
  executeCosmosContract,
  getCosmosClient,
  wasmQuery,
  type CosmosClient,
} from "@shared/cosmos_client";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";

colors.enable();
const logger = new Logger("test-dispatch-cosmos");

export const HYP_COSMOS_MAILBOX =
  "stars1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrq096cja";
export const ETH_CHAIN_DOMAIN = 11820; // stargaze
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
    const client: CosmosClient = await getCosmosClient(networkId, mnemonic);
    const funds = coins(10000000, client.network.gas.denom);
    console.log(`${JSON.stringify(funds)}`);
    console.log(`receipt[${recipientAddr}]`);
    console.log(`destDomain[${ETH_CHAIN_DOMAIN}]`);
    console.log(`mailbox[${HYP_COSMOS_MAILBOX}]`);

    const msg0 = { mailbox: { default_hook: {} } };
    console.log(`msg: ${JSON.stringify(msg0, null, 2)}`);
    let res: JsonObject = await wasmQuery(client, HYP_COSMOS_MAILBOX, msg0);
    console.log(`default_hook= ${res["default_hook"]}`);

    console.log(
      `cosmos -> eth : [${res["default_hook"]}] -> [${addPad(
        extractByte32AddrFromBech32(res["default_hook"])
      )}]`
    );

    const msg1 = {
      hook: {
        quote_dispatch: {
          sender: "stars1wj8h432p89c86fehty9xmwrnx78ttnrp0auwmq",
          msg: {
            dest_domain: 11820,
            recipient_addr: addPad(
              extractByte32AddrFromBech32(res["default_hook"])
            ),
            msg_body: Buffer.from(TEST_MSG, "utf-8").toString("hex"),
          },
        },
      },
    };

    console.log(`msg: ${JSON.stringify(msg1, null, 2)}`);
    res = await wasmQuery(client, HYP_COSMOS_MAILBOX, msg1);
    console.log(`fees=${JSON.stringify(res["fees"], null, 2)}`);

    const msg2 = {
      dispatch: {
        dest_domain: ETH_CHAIN_DOMAIN,
        recipient_addr: addPad(recipientAddr),
        msg_body: Buffer.from(TEST_MSG, "utf-8").toString("hex"),
      },
    };
    console.log(JSON.stringify(msg2, null, 2));
    console.log(`funds: ${JSON.stringify(funds, null, 2)}`);
    res = await executeCosmosContract(
      client,
      "mailbox",
      HYP_COSMOS_MAILBOX,
      msg2,
      funds
    );

    console.log(res);
  });
