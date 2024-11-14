import fs from "fs";
const solc = require("solc");

import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";
import { deployDemo } from "@eth_contracts/demo";

colors.enable();
const logger = new Logger("compile");

export const contractCmd = new Command("contract")
  .configureHelp({
    showGlobalOptions: true,
  })
  .command("compile")
  .action(async () => {
    logger.info("Compiling.");
    // Load the contract source code
    const sourceCode = await fs.readFileSync("contracts/demo.sol", "utf8");
    // Compile the source code and retrieve the ABI and Bytecode
    const { abi, bytecode } = compile(sourceCode, "Demo");
    // Store the ABI and Bytecode into a JSON file
    const artifact = JSON.stringify({ abi, bytecode }, null, 2);
    await fs.writeFileSync("demo.json", artifact);
  });

contractCmd
  .command("deploy")
  .argument("<networkId>", "network Id")
  .argument("<mnemonic>", "mnemonic")
  .action(async (networkId, mnemonic) => {
    logger.info(`Deploying on ${networkId}`);
    const client = new EthClient(networkId, mnemonic);
    const { abi, bytecode } = await load();
    await deployDemo(client.signer, abi, bytecode);
  });

function compile(sourceCode: string, contractName: string) {
  // Create the Solidity Compiler Standard Input and Output JSON
  const input = {
    language: "Solidity",
    sources: { main: { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };
  // Parse the compiler output to retrieve the ABI and Bytecode
  const output = solc.compile(JSON.stringify(input));
  const artifact = JSON.parse(output).contracts.main[contractName];

  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

async function load() {
  // later to use
  const demoJson: string = await fs.readFileSync("demo.json", "utf8");
  const artifact = JSON.parse(demoJson);
  return {
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  };
}
