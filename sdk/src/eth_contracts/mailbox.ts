import { Mailbox__factory } from "@hyperlane-xyz/core";
import { Contract, ContractFactory, ethers, Signer, Wallet } from "ethers";
import web3 from "web3";

export async function deployMailbox(
  signer: Wallet,
  domain: number
): Promise<string> {
  const mailboxFactory = new ContractFactory(
    Mailbox__factory.abi,
    Mailbox__factory.bytecode,
    signer
  );

  const mailboxFactoryWithSigner = mailboxFactory.connect(signer);
  const contract = await mailboxFactoryWithSigner.deploy(domain);
  await contract.deployed();
  return contract.address;
}

export function getMailboxContract(
  signer: Wallet,
  mailboxAddr: string
): Contract {
  const contract = new ethers.Contract(
    mailboxAddr,
    Mailbox__factory.abi,
    signer
  );
  return contract.connect(signer);
}

export async function executeMailbox_setDefaultIsm(
  contract: Contract,
  ismAddr: string
) {
  let txr = await contract.setDefaultIsm(ismAddr);
  await txr.wait();
}

export async function executeMailbox_dispatch(
  contract: Contract,
  domain: number,
  recipientAddr: string,
  msg: string
) {
  // _destinationDomain: uint32
  // _recipientAddress: bytes32
  // _messageBody: bytes

  const value = web3.utils.padLeft(recipientAddr, 64);

  let txr = await contract["dispatch(uint32,bytes32,bytes)"](
    domain,
    value,
    msg
  );
  await txr.wait();
}

export async function queryMailbox_defaultIsm(
  contract: Contract
): Promise<string> {
  const multisigIsmAddr: string = await contract.defaultIsm();
  return multisigIsmAddr;
}

export async function queryMailbox_localDomain(
  contract: Contract
): Promise<string> {
  const localDomain: string = await contract.localDomain();
  return localDomain;
}

export async function queryMailbox_recipientIsm(
  contract: Contract,
  recipient: string
): Promise<string> {
  const recipientIsm: string = await contract.recipientIsm(recipient);
  return recipientIsm;
}
