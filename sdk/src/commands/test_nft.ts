import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";
import { extractByte32AddrFromBech32 } from "@shared/utils";
import { HypEthMailbox } from "../contracts/eth_contracts/mailbox";
import { HypERC721 } from "../contracts/eth_contracts/erc721";

colors.enable();
const logger = new Logger("test-nft");

// staticMessageIdMultisigIsmFactory: 0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7
export const HYP_MULTSIG_ISM_FACTORY =
  "0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7";
export const HYP_MAILBOX = "0x067A44Af3D39893Bd783518F6b687d89aed8f9b7";
export const HYP_CW20 = "star....";
export const COSMOS_CHAIN_DOMAIN = 7865; // stargaze
export const ROUTE = "star...";

export const testNftCmd = new Command("test-nft")
  .configureHelp({
    showGlobalOptions: true,
  })
  .argument("<networkId>", "network Id")
  .argument("<mnemonic>", "mnemonic")
  .action(async (networkId, mnemonic) => {
    const client = new EthClient(networkId, mnemonic);

    const mailbox = await HypEthMailbox.buildFromAlreadyDeployed(
      client.signer,
      HYP_MAILBOX,
      client.networkConfig.domain
    );

    const hypERC721: HypERC721 = await HypERC721.build(
      client.signer,
      mailbox.addr()
    );

    hypERC721.enrollRemoteRouter(
      COSMOS_CHAIN_DOMAIN,
      `0x${extractByte32AddrFromBech32(ROUTE)}`
    );

    hypERC721.transfer(COSMOS_CHAIN_DOMAIN);

    console.log(`result [${hypERC721.addr()}]`);
  });
