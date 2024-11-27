import { Logger } from "../../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";

const logger = new Logger("demo");

interface IDemo {
  addr(): string;
}

export class Demo implements IDemo {
  private signer: Wallet;
  private contract: Contract;
  private address: any;
  private abi: any;
  private bytecode: any;

  constructor(
    signer: Wallet,
    contract: Contract,
    address: string,
    abi: any,
    bytecode: any
  ) {
    this.signer = signer;
    this.contract = contract;
    this.address = address;
    this.abi = abi;
    this.bytecode = bytecode;
  }

  addr(): string {
    return this.address;
  }

  public static async build(
    signer: Wallet,
    abi: any,
    bytecode: any
  ): Promise<Demo> {
    const address = await this.deploy(signer, abi, bytecode);
    const contract: Contract = new ethers.Contract(address, abi, signer);
    return new Demo(signer, contract, address, abi, bytecode);
  }

  public static async deploy(
    signer: Wallet,
    abi: any,
    bytecode: any
  ): Promise<string> {
    // 1. Deploy TestRecipient
    const hypERC20Factory = new ContractFactory(abi, bytecode, signer);

    // instantiate
    const contract = await hypERC20Factory.deploy(); // decimals, mailbox
    await contract.deployed();
    return contract.address;
  }
}
