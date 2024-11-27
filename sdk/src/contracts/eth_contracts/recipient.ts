import { TestRecipient__factory } from "@hyperlane-xyz/core";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";
import type { ITestRecipient, ITestRecipientExecute } from "../irecipient";

export class TestEthRecipient implements ITestRecipient, ITestRecipientExecute {
  private signer: Wallet;
  private contract: Contract;
  private address: any;

  constructor(signer: Wallet, contract: Contract, address: string) {
    this.signer = signer;
    this.address = address;
    this.contract = contract;
  }
  addr(): string {
    return this.address;
  }

  public static async build(signer: Wallet): Promise<TestEthRecipient> {
    const address = await this.deploy(signer);
    const contract: Contract = new ethers.Contract(
      address,
      TestRecipient__factory.abi,
      signer
    );
    return new TestEthRecipient(signer, contract, address);
  }

  public static async deploy(signer: Wallet): Promise<string> {
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

  async setInterchainSecurityModule(ismAddr: string) {
    const client = this.contract;
    const test_recipientWithSigner = client.connect(this.signer);
    const test_txr = await test_recipientWithSigner.setInterchainSecurityModule(
      ismAddr
    );
    await test_txr.wait();
  }
}
