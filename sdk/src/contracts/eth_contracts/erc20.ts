import { HypERC20__factory } from "@hyperlane-xyz/core";
import { Logger } from "../../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";
import type {
  IHypWarpNative,
  IHypWarpNativeExecute,
  IHypWarpNativeQuery,
} from "../iwarp_native";

const logger = new Logger("erc20");

export class HypERC20
  implements IHypWarpNative, IHypWarpNativeQuery, IHypWarpNativeExecute
{
  private signer: Wallet;
  private contract: Contract;
  private address: any;

  constructor(signer: Wallet, contract: Contract, address: string) {
    this.signer = signer;
    this.address = address;
    this.contract = contract;
  }
  setMailbox(mailboxAddr: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  setHook(hookAddr: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  setRoute(
    destination_domain: number,
    destination_route: string
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }
  transfer(
    destination_domain: number,
    amount: number,
    fee: number
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }
  status(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  tokenType(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  tokenMode(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  mailbox(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  hook(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  ism(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  domains(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  route(domain: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  routes(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async enrollRemoteRouter(
    destination_domain: number,
    destination_route: string
  ): Promise<any> {
    // link
    const router = `0x${addPad(
      extractByte32AddrFromBech32(destination_route)
    )}`;
    logger.log(
      `enrollRemoteRouter: destination_domain: ${destination_domain} destination_route: ${router}`
    );
    let txr = await this.contract.enrollRemoteRouter(
      destination_domain,
      router
    );
    await txr.wait();
  }

  async EthTransfer(
    destination_domain: number,
    amount: number,
    fee: number
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }

  addr(): string {
    return this.address;
  }

  public static async build(
    signer: Wallet,
    mailboxAddr: string
  ): Promise<HypERC20> {
    const address = await this.deploy(signer, mailboxAddr);
    const contract: Contract = new ethers.Contract(
      address,
      HypERC20__factory.abi,
      signer
    );
    return new HypERC20(signer, contract, address);
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

  async initialize(hook: string, ism: string) {
    const client = this.contract;
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
    const client = this.contract;
    const clientWithSigner = client.connect(this.signer);

    // register ism address in the warp contract
    let txr = await clientWithSigner.setInterchainSecurityModule(ism);
    await txr.wait();
  }
}
