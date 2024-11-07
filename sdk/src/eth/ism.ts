import { StaticMessageIdMultisigIsmFactory__factory } from "@hyperlane-xyz/core";
import { Logger } from "../shared/logger";
import { Contract, ContractFactory, ethers, Signer, Wallet } from "ethers";

const logger = new Logger("ism");

export async function deployISM(signer: Wallet): Promise<string> {
  const ISMFactory = new ContractFactory(
    StaticMessageIdMultisigIsmFactory__factory.abi,
    StaticMessageIdMultisigIsmFactory__factory.bytecode,
    signer
  );

  const ISMFactoryWithSigner = ISMFactory.connect(signer);
  const contract = await ISMFactoryWithSigner.deploy();
  await contract.deployed();
  return contract.address;
}

export function getISMContract(signer: Wallet, ismAddr: string): Contract {
  return new ethers.Contract(
    ismAddr,
    StaticMessageIdMultisigIsmFactory__factory.abi,
    signer
  );
}

export async function queryISM_getSignerAddress(
  signer: Wallet,
  ismAddr: string
): Promise<string> {
  const contract = getISMContract(signer, ismAddr);

  const multisigIsmAddr: string = await contract.getAddress(
    [signer.address],
    1
  );
  return multisigIsmAddr;
}
