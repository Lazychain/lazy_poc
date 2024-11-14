import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";
import { getMailboxContract } from "../eth_contracts/mailbox";
import { deployhypERC20, getHypERC20Contract } from "../eth_contracts/erc20";
import type { Contract } from "ethers";
import { extractByte32AddrFromBech32 } from "@shared/utils";

colors.enable();
const logger = new Logger("test-token");

// staticMessageIdMultisigIsmFactory: 0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7
export const HYP_MULTSIG_ISM_FACTORY =
  "0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7";
export const HYP_MAILBOX = "0x067A44Af3D39893Bd783518F6b687d89aed8f9b7";
export const HYP_CW20 = "star....";
export const COSMOS_CHAIN_DOMAIN = 7865; // stargaze
export const ROUTE = "star...";

export const testTokenCmd = new Command("test-token")
  .configureHelp({
    showGlobalOptions: true,
  })
  .argument("<networkId>", "network Id")
  .argument("<mnemonic>", "mnemonic")
  .action(async (networkId, mnemonic) => {
    const client = new EthClient(networkId, mnemonic);

    const mailbox = getMailboxContract(client.signer, HYP_MAILBOX);

    const hypErc20Addr = await deployhypERC20(client.signer, mailbox.address);
    const HypERC20 = getHypERC20Contract(client.signer, hypErc20Addr);
    const HypERC20WithSigner = HypERC20.connect(client.signer);

    await linkhypERC20(HypERC20WithSigner, COSMOS_CHAIN_DOMAIN, ROUTE);

    await transferhypERC20(HypERC20WithSigner, COSMOS_CHAIN_DOMAIN, HYP_CW20);

    console.log(`result [${hypErc20Addr}]`);
  });

async function linkhypERC20(
  hypERC20ContractWithSigner: Contract,
  domain: number,
  route: string
) {
  // link
  let txr = await hypERC20ContractWithSigner.enrollRemoteRouter(
    domain,
    `0x${extractByte32AddrFromBech32(route)}`
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}

async function transferhypERC20(
  hypERC20ContractWithSigner: Contract,
  domain: number,
  hypCW20Addr: string
) {
  // Transfer ERC20 to cosmos blockchain
  let txr = await hypERC20ContractWithSigner.transferRemote(
    domain,
    `0x${extractByte32AddrFromBech32(hypCW20Addr)}`,
    1_000_000n
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}
