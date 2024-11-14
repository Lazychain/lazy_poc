import { Logger } from "../shared/logger";
import { ContractFactory, Wallet } from "ethers";

const logger = new Logger("demo");

export async function deployDemo(
  signer: Wallet,
  abi: any,
  bytecode: any
): Promise<string> {
  // 1. Deploy TestRecipient
  const demoFactory = new ContractFactory(abi, bytecode, signer);

  // instantiate
  const contract = await demoFactory.deploy();
  await contract.deployed();
  return contract.address;
}
