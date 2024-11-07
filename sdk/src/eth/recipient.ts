import { TestRecipient__factory } from "@hyperlane-xyz/core";
import { Logger } from "../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";

const logger = new Logger("recipient");

const TEST_MSG = "0x68656c6c6f";

export async function deployReceipt(signer: Wallet): Promise<string> {
  // 1. Deploy TestRecipient
  const testRecipientFactory = new ContractFactory(
    TestRecipient__factory.abi,
    TestRecipient__factory.bytecode,
    signer
  );

  // Instantiate empty parameters
  const contract = await testRecipientFactory.deploy();
  await contract.deployed();
  return contract.address;
}

export function getReceiptContract(
  signer: Wallet,
  testRecipientAddr: string
): Contract {
  return new ethers.Contract(
    testRecipientAddr,
    TestRecipient__factory.abi,
    signer
  );
}

export async function executeReceipt_setInterchainSecurityModule(
  signer: Wallet,
  recipientAddr: string,
  ismAddr: string
) {
  const client = getReceiptContract(signer, recipientAddr);
  const test_recipientWithSigner = client.connect(signer);
  const test_txr = await test_recipientWithSigner.setInterchainSecurityModule(
    ismAddr
  );
  await test_txr.wait();
}
