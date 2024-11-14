import { HypERC20__factory } from "@hyperlane-xyz/core";
import { Logger } from "../shared/logger";
import { Contract, ContractFactory, ethers, Wallet } from "ethers";

const logger = new Logger("erc20");

export async function deployhypERC20(
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
  const contract = await hypERC20Factory.deploy([6, mailboxAddr]);
  await contract.deployed();
  return contract.address;
}

export function getHypERC20Contract(
  signer: Wallet,
  hypERC20Addr: string
): Contract {
  return new ethers.Contract(hypERC20Addr, HypERC20__factory.abi, signer);
}

export async function executeERC20_initialize(
  signer: Wallet,
  erc20Addr: string
) {
  const client = getHypERC20Contract(signer, erc20Addr);
  const clientWithSigner = client.connect(signer);

  let txr = await clientWithSigner.initialize(
    0n,
    "Hyperlane Bridged STAR",
    "STAR"
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}

export async function executeERC20_setInterchainSecurityModule(
  signer: Wallet,
  erc20Addr: string,
  ismAddr: string
) {
  const client = getHypERC20Contract(signer, erc20Addr);
  const clientWithSigner = client.connect(signer);

  // register ism address in the warp contract
  let txr = await clientWithSigner.setInterchainSecurityModule(ismAddr);
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}
