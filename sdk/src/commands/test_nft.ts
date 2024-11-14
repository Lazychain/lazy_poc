import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";
import { getMailboxContract } from "../eth_contracts/mailbox";
import type { Contract } from "ethers";
import { extractByte32AddrFromBech32 } from "@shared/utils";
import { deployhypERC721, getHypERC721Contract } from "../eth_contracts/erc721";

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

    const mailbox = getMailboxContract(client.signer, HYP_MAILBOX);

    const hypERC721Addr = await deployhypERC721(client.signer, mailbox.address);
    const HypERC721 = getHypERC721Contract(client.signer, hypERC721Addr);
    const HypERC721WithSigner = HypERC721.connect(client.signer);

    await linkhypERC721(HypERC721WithSigner, COSMOS_CHAIN_DOMAIN, ROUTE);

    await transferhypERC721(HypERC721WithSigner, COSMOS_CHAIN_DOMAIN, HYP_CW20);

    console.log(`result [${hypERC721Addr}]`);
  });

async function linkhypERC721(
  hypERC721ContractWithSigner: Contract,
  domain: number,
  route: string
) {
  // link
  let txr = await hypERC721ContractWithSigner.enrollRemoteRouter(
    domain,
    `0x${extractByte32AddrFromBech32(route)}`
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}

async function transferhypERC721(
  hypERC721ContractWithSigner: Contract,
  domain: number,
  hypCW20Addr: string
) {
  // Transfer ERC721 to cosmos blockchain
  let txr = await hypERC721ContractWithSigner.transferRemote(
    domain,
    `0x${extractByte32AddrFromBech32(hypCW20Addr)}`,
    1_000_000n
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}
