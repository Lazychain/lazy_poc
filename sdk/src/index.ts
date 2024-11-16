import { Command } from "commander";
import { version } from "../package.json";
import { walletCmd } from "@commands/wallet";
import { testDispatchEthCmd } from "@commands/test_dispatch_eth";
import { testNftCmd } from "@commands/test_nft";
import { testDispatchCosmosCmd } from "@commands/test_dispatch_cosmos";
import { contractCmd } from "@commands/compile";
import { testWarp01Cmd } from "@commands/test_warp_01";

const cli = new Command();
cli.name("lazy").version(version).description("CLI toolkit");
cli.addCommand(walletCmd);
cli.addCommand(testDispatchEthCmd);
cli.addCommand(testDispatchCosmosCmd);
cli.addCommand(testWarp01Cmd);
cli.addCommand(testNftCmd);
cli.addCommand(contractCmd);
cli.parseAsync(process.argv).catch(console.error);
