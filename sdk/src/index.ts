import { Command } from "commander";
import { version } from "../package.json";
import { walletCmd } from "@commands/wallet";
import { testDispatchEthCmd } from "@commands/test_dispatch_eth";
import { testTokenCmd } from "@commands/test_erc20";
import { testNftCmd } from "@commands/test_nft";
import { testDispatchCosmosCmd } from "@commands/test_dispatch_cosmos";
import { compileCmd } from "@commands/compile";

const cli = new Command();
cli.name("lazy").version(version).description("CLI toolkit");
cli.addCommand(walletCmd);
cli.addCommand(testDispatchEthCmd);
cli.addCommand(testDispatchCosmosCmd);
cli.addCommand(testTokenCmd);
cli.addCommand(testNftCmd);
cli.addCommand(compileCmd);
cli.parseAsync(process.argv).catch(console.error);
