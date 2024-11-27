import { Mailbox__factory } from "@hyperlane-xyz/core";
import { Contract, ContractFactory, ethers, Signer, Wallet } from "ethers";
import web3 from "web3";
import type {
  IHypMailbox,
  IHypMailboxExecute,
  IHypMailboxQuery,
} from "../imailbox";

export class HypEthMailbox
  implements IHypMailbox, IHypMailboxExecute, IHypMailboxQuery
{
  private signer: Wallet;
  private address: any;
  private domain: number;
  private contract: Contract;

  constructor(
    signer: Wallet,
    contract: Contract,
    address: string,
    domain: number
  ) {
    this.signer = signer;
    this.address = address;
    this.domain = domain;
    this.contract = contract;
  }
  async quoteDispatch(
    sender: string,
    recipientAddr: string,
    message: string,
    destDomain: number
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async latestDispathId(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async nonce(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async requiredHook(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async defaultHook(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async hrp(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async messageDelivered(messageId: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async status() {
    throw new Error("Method not implemented.");
  }

  addr(): string {
    return this.address;
  }

  public static async build(
    signer: Wallet,
    domain: number
  ): Promise<HypEthMailbox> {
    const address = await this.deploy(signer, domain);
    const contract: Contract = new ethers.Contract(
      address,
      Mailbox__factory.abi,
      signer
    );
    return new HypEthMailbox(signer, contract, address, domain);
  }

  public static async buildFromAlreadyDeployed(
    signer: Wallet,
    address: string,
    domain: number
  ): Promise<HypEthMailbox> {
    const contract: Contract = new ethers.Contract(
      address,
      Mailbox__factory.abi,
      signer
    );
    return new HypEthMailbox(signer, contract, address, domain);
  }

  public static async deploy(signer: Wallet, domain: number): Promise<string> {
    // 1. Deploy TestRecipient
    const hypMailboxFactory = new ContractFactory(
      Mailbox__factory.abi,
      Mailbox__factory.bytecode,
      signer
    );

    // instantiate
    const contract = await hypMailboxFactory.deploy(domain);
    await contract.deployed();
    return contract.address;
  }

  async setDefaultIsm(ismAddr: string) {
    const client = this.contract;
    let txr = await client.setDefaultIsm(ismAddr);
    await txr.wait();
  }

  async dispatch(domain: number, recipientAddr: string, msg: string) {
    // _destinationDomain: uint32
    // _recipientAddress: bytes32
    // _messageBody: bytes
    const client = this.contract;
    const value = web3.utils.padLeft(recipientAddr, 64);

    let txr = await client["dispatch(uint32,bytes32,bytes)"](
      domain,
      value,
      msg
    );
    await txr.wait();
  }

  async defaultIsm(): Promise<string> {
    const client = this.contract;
    const multisigIsmAddr: string = await client.defaultIsm();
    return multisigIsmAddr;
  }
  async localDomain(): Promise<string> {
    const client = this.contract;
    const localDomain: string = await client.localDomain();
    return localDomain;
  }

  async recipientIsm(recipient: string): Promise<string> {
    const client = this.contract;
    const recipientIsm: string = await client.recipientIsm(recipient);
    return recipientIsm;
  }
}
