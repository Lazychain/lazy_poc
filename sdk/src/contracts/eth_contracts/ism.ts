import { StaticMessageIdMultisigIsmFactory__factory } from "@hyperlane-xyz/core";
import { Contract, ContractFactory, ethers, Signer, Wallet } from "ethers";
import type { IHypIsm, IHypIsmQuery } from "../iism";

export class HypIsm implements IHypIsm, IHypIsmQuery {
  private signer: Wallet;
  private address: any;
  private contract: Contract;

  constructor(signer: Wallet, contract: Contract, address: string) {
    this.signer = signer;
    this.address = address;
    this.contract = contract;
  }
  addr(): string {
    return this.address;
  }

  public static async build(signer: Wallet): Promise<HypIsm> {
    const address = await this.deploy(signer);
    const contract = new ethers.Contract(
      address,
      StaticMessageIdMultisigIsmFactory__factory.abi,
      signer
    );
    return new HypIsm(signer, contract, address);
  }

  public static async deploy(signer: Wallet): Promise<string> {
    // 1. Deploy TestRecipient
    const hypIsmFactory = new ContractFactory(
      StaticMessageIdMultisigIsmFactory__factory.abi,
      StaticMessageIdMultisigIsmFactory__factory.bytecode,
      signer
    );

    // instantiate
    const contract = await hypIsmFactory.deploy();
    await contract.deployed();
    return contract.address;
  }

  async getSignerAddress(): Promise<string> {
    const contract = this.contract;

    const multisigIsmAddr: string = await contract.getAddress(
      [this.signer.address],
      1
    );
    return multisigIsmAddr;
  }
}
