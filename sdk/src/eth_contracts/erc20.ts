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
  const contract = await hypERC20Factory.deploy(6, mailboxAddr); // decimals, mailbox
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
  erc20Addr: string,
  hook: string,
  ism: string
) {
  const client = getHypERC20Contract(signer, erc20Addr);
  const clientWithSigner = client.connect(signer);

  const totalSupply = 0n; // Total supply
  const name = "Hyperlane Bridged STAR"; // Warp contract name
  const symbol = "STAR"; // Warp route asset name
  const owner = signer.address;
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
}

export async function EthTransfer(
  hypERC20ContractWithSigner: Contract, // address of warp route
  destination_domain: number,
  amount: number,
  fee: number
) {}
