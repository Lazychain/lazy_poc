import { HypERC20__factory } from "@hyperlane-xyz/core";
import { Logger } from "../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";

const logger = new Logger("erc20");

// TODO: https://refactoring.guru/design-patterns/factory-method/typescript/example
interface IHypERC20 {
  getContract(): Contract;
  initialize(hook: string, ism: string): any;
  setInterchainSecurityModule(ism: string): any;
  EthTransfer(destination_domain: number, amount: number, fee: number): any;
}

export class HypERC20 implements IHypERC20 {
  private signer: Wallet;
  private address: any;

  constructor(signer: Wallet, address: string) {
    this.signer = signer;
    this.address = address;
  }

  public static async build(
    signer: Wallet,
    mailboxAddr: string
  ): Promise<HypERC20> {
    const address = await this.deploy(signer, mailboxAddr);
    return new HypERC20(signer, address);
  }

  public static async deploy(
    signer: Wallet,
    mailboxAddr: string
  ): Promise<string> {
    // 1. Deploy TestRecipient
    const hypERC20Factory = new ContractFactory(
      HypERC20__factory.abi,
      HypERC20__factory.bytecode,
      signer
    );

    // instantiate
    const contract = await hypERC20Factory.deploy(6, mailboxAddr); // decimals, mailbox
    await contract.deployed();
    return contract.address;
  }

  getContract(): Contract {
    return new ethers.Contract(
      this.address,
      HypERC20__factory.abi,
      this.signer
    );
  }

  async initialize(hook: string, ism: string) {
    const client = this.getContract();
    const clientWithSigner = client.connect(this.signer);

    const totalSupply = 0n; // Total supply
    const name = "Hyperlane Bridged STAR"; // Warp contract name
    const symbol = "STAR"; // Warp route asset name
    const owner = this.signer.address;
    let txr = await clientWithSigner.initialize(
      totalSupply,
      name,
      symbol,
      hook,
      ism,
      owner
    );
    await txr.wait();
  }

  async setInterchainSecurityModule(ism: string) {
    const client = this.getContract();
    const clientWithSigner = client.connect(this.signer);

    // register ism address in the warp contract
    let txr = await clientWithSigner.setInterchainSecurityModule(ism);
    await txr.wait();
  }

  EthTransfer(destination_domain: number, amount: number, fee: number) {
    throw new Error("Method not implemented.");
  }
}
