import { HypERC721__factory } from "@hyperlane-xyz/core";
import { Logger } from "../../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";
import { extractByte32AddrFromBech32 } from "@shared/utils";
import type { IHypWarpNative, IHypWarpNativeExecute } from "../iwarp_native";

/*
export type { HypERC721 } from "../types/contracts/token/HypERC721.js";
export { HypERC721__factory } from "../types/factories/contracts/token/HypERC721__factory.js";
export type { HypERC721Collateral } from "../types/contracts/token/HypERC721Collateral.js";
export { HypERC721Collateral__factory } from "../types/factories/contracts/token/HypERC721Collateral__factory.js";
*/
const logger = new Logger("erc721");

export class HypERC721 implements IHypWarpNative, IHypWarpNativeExecute {
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

  addr(): string {
    return this.address;
  }

  public static async build(
    signer: Wallet,
    mailboxAddr: string
  ): Promise<HypERC721> {
    const address = await this.deploy(signer, mailboxAddr);
    const contract: Contract = new ethers.Contract(
      address,
      HypERC721__factory.abi,
      signer
    );

    return new HypERC721(signer, contract, address);
  }

  public static async deploy(
    signer: Wallet,
    mailboxAddr: string
  ): Promise<string> {
    // 1. Deploy TestRecipient
    const hypERC721Factory = new ContractFactory(
      HypERC721__factory.abi,
      HypERC721__factory.bytecode,
      signer
    );

    // instantiate
    const contract = await hypERC721Factory.deploy();
    await contract.deployed();
    return contract.address;
  }

  async initialize(hook: string, ism: string) {
    const client = this.contract;
    const clientWithSigner = client.connect(this.signer);

    // TODO: set properties
    const owner = this.signer.address;
    let txr = await clientWithSigner.initialize(hook, ism, owner);
    await txr.wait();
  }

  async setInterchainSecurityModule(ism: string) {
    const client = this.contract;
    const clientWithSigner = client.connect(this.signer);

    // register ism address in the warp contract
    let txr = await clientWithSigner.setInterchainSecurityModule(ism);
    await txr.wait();
  }

  async enrollRemoteRouter(domain: number, route: string) {
    const client = this.contract;
    // link
    let txr = await client.enrollRemoteRouter(
      domain,
      `0x${extractByte32AddrFromBech32(route)}`
    );
    await txr.wait();
    logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
  }

  async transfer(
    destination_domain: number,
    amount: number = 1,
    fee: number = 0
  ): Promise<any> {
    const client = this.contract;
    // Transfer ERC721 to cosmos blockchain
    let txr = await client.transferRemote(
      destination_domain,
      `0x${extractByte32AddrFromBech32(this.address)}`,
      amount
    );
    await txr.wait();
    logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
  }
}
