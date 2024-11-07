import {
  deployhypERC20,
  getHypERC20Contract,
  getISMContract,
  getMailboxContract,
} from "@eth/contracts";
import { Logger } from "@shared/logger";
import { extractByte32AddrFromBech32 } from "@shared/utils";
import colors from "colors";
import { Contract, providers, Wallet } from "ethers";
import "reflect-metadata";

colors.enable();
const logger = new Logger("test02");

// staticMessageIdMultisigIsmFactory: 0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7
export const HYP_MULTSIG_ISM_FACTORY =
  "0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7";
export const HYP_MAILBOX = "0x067A44Af3D39893Bd783518F6b687d89aed8f9b7";
export const HYP_CW20 = "star....";
export const COSMOS_CHAIN_DOMAIN = 7865; // stargaze
export const ROUTE = "star...";

async function main(mnemonic: string) {
  const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    "http://localhost:8545"
  );
  const wallet: Wallet = Wallet.fromMnemonic(mnemonic);
  const signer = wallet.connect(provider);

  const ism = getISMContract(HYP_MULTSIG_ISM_FACTORY);
  const mailbox = getMailboxContract(HYP_MAILBOX);

  const hypErc20Addr = await deployhypERC20(
    signer,
    ism.address,
    mailbox.address
  );
  const HypERC20 = getHypERC20Contract(hypErc20Addr);
  const HypERC20WithSigner = HypERC20.connect(signer);

  await linkAndTransferhypERC20(
    HypERC20WithSigner,
    COSMOS_CHAIN_DOMAIN,
    ROUTE,
    HYP_CW20
  );

  console.log(`result [${hypErc20Addr}]`);
}

async function linkAndTransferhypERC20(
  hypERC20ContractWithSigner: Contract,
  domain: number,
  route: string,
  hypCW20Addr: string
) {
  // link
  let txr = await hypERC20ContractWithSigner.enrollRemoteRouter(
    domain,
    `0x${extractByte32AddrFromBech32(route)}`
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);

  // Transfer ERC20 to cosmos blockchain
  txr = await hypERC20ContractWithSigner.transferRemote(
    domain,
    `0x${extractByte32AddrFromBech32(hypCW20Addr)}`,
    1_000_000n
  );
  await txr.wait();
  logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
}

main(process.argv.slice(2).toString())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
