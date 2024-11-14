import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import {
  cosmosWalletBalance,
  cosmosWalletFromMnemonic,
  createMnemonic,
  ethWalletBalance,
  ethWalletFromMnemonic,
} from "@shared/wallet";

colors.enable();
const logger = new Logger("wallet");

export const walletCmd = new Command("wallet").configureHelp({
  showGlobalOptions: true,
});

walletCmd.command("create").action(async () => {
  const mnemonic = createMnemonic();
  const cosmos_wallet = await cosmosWalletFromMnemonic(mnemonic);
  const eth_wallet = await ethWalletFromMnemonic(mnemonic);
  logger.json({ cosmos_wallet: cosmos_wallet, eth_wallet: eth_wallet });
});

walletCmd
  .command("recover")
  .argument("<mnemonic>", "24 words")
  .option("-k --keyfile", "export eth keyfile")
  .action(async (mnemonic, options) => {
    logger.info(mnemonic);
    const cosmos_wallet = await cosmosWalletFromMnemonic(mnemonic);
    const eth_wallet = await ethWalletFromMnemonic(mnemonic, options.keyfile);
    logger.json({ cosmos_wallet: cosmos_wallet, eth_wallet: eth_wallet });
  });

walletCmd
  .command("balance")
  .argument("<address>", "address")
  .option("-p --port <port>", "http://localhost:<port>, default 8545 / 26657")
  .action(async (address, port) => {
    if (address.startsWith("0x")) {
      logger.info(await ethWalletBalance(address, port["port"]));
    } else {
      logger.json(await cosmosWalletBalance(address, port["port"]));
    }
  });
