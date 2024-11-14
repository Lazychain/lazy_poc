import { HypERC721__factory } from "@hyperlane-xyz/core";
import { Logger } from "../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";

/*
export type { HypERC721 } from "../types/contracts/token/HypERC721.js";
export { HypERC721__factory } from "../types/factories/contracts/token/HypERC721__factory.js";
export type { HypERC721Collateral } from "../types/contracts/token/HypERC721Collateral.js";
export { HypERC721Collateral__factory } from "../types/factories/contracts/token/HypERC721Collateral__factory.js";
*/
const logger = new Logger("erc721");

export async function deployhypERC721(
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
  const contract = await hypERC721Factory.deploy([6, mailboxAddr]);
  await contract.deployed();
  return contract.address;
}

export function getHypERC721Contract(
  signer: Wallet,
  hypERC721Addr: string
): Contract {
  return new ethers.Contract(hypERC721Addr, HypERC721__factory.abi, signer);
}

export async function executeERC721_initialize(
  signer: Wallet,
  ERC721Addr: string
) {
  const client = getHypERC721Contract(signer, ERC721Addr);
  const clientWithSigner = client.connect(signer);

  let txr = await clientWithSigner.initialize(
    0n,
    "Hyperlane Bridged STAR",
    "STAR"
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}

export async function executeERC721_setInterchainSecurityModule(
  signer: Wallet,
  ERC721Addr: string,
  ismAddr: string
) {
  const client = getHypERC721Contract(signer, ERC721Addr);
  const clientWithSigner = client.connect(signer);

  // register ism address in the warp contract
  let txr = await clientWithSigner.setInterchainSecurityModule(ismAddr);
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}
