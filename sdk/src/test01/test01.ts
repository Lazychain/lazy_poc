import colors from "colors";
import { providers, Wallet } from "ethers";
import "reflect-metadata";
import { Logger } from "@shared/logger";
import { queryISM_getSignerAddress } from "@eth/ism";
import {
  executeMailbox_dispatch,
  getMailboxContract,
  queryMailbox_defaultIsm,
  queryMailbox_localDomain,
  queryMailbox_recipientIsm,
} from "@eth/mailbox";
import {
  deployReceipt,
  executeReceipt_setInterchainSecurityModule,
} from "@eth/recipient";

colors.enable();

const logger = new Logger("test01");

// staticMessageIdMultisigIsmFactory: 0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7
export const HYP_MULTSIG_ISM_FACTORY =
  "0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7";
export const HYP_MAILBOX = "0x067A44Af3D39893Bd783518F6b687d89aed8f9b7";
export const COSMOS_CHAIN_DOMAIN = 7865; // stargaze
const TEST_MSG = "0x68656c6c6f";

async function main(mnemonic: string) {
  logger.notice(
    "Running Test Receipt contract. Once deployed it will sent a hello message to the other side."
  );
  const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    "http://localhost:8545"
  );
  const wallet: Wallet = Wallet.fromMnemonic(mnemonic);
  const signer = wallet.connect(provider);

  // if we need to create and deploy new contracts

  //const ismAddr = await deployISM(signer);
  //const mailboxAddr = await deployMailbox(signer, COSMOS_CHAIN_DOMAIN);
  //const ismAddr = getISMContract(signer, HYP_MULTSIG_ISM_FACTORY).address;
  //const mailbox = getMailboxContract(HYP_MAILBOX);
  //await executeMailbox_setDefaultIsm(signer, mailboxAddr, ismAddr);

  const mailbox = getMailboxContract(signer, HYP_MAILBOX);

  // Some validations

  // await queryISM_getSignerAddress(signer, HYP_MULTSIG_ISM_FACTORY);
  // await queryMailbox_defaultIsm(mailbox);
  // await queryMailbox_localDomain(mailbox);
  // await queryMailbox_recipientIsm(mailbox, HYP_MULTSIG_ISM_FACTORY);

  const recipientAddr = await deployReceipt(signer);
  await executeReceipt_setInterchainSecurityModule(
    signer,
    recipientAddr,
    HYP_MULTSIG_ISM_FACTORY
  );

  //const bytecode = await provider.getCode(testRecipientAddr);
  await executeMailbox_dispatch(
    mailbox,
    COSMOS_CHAIN_DOMAIN,
    recipientAddr,
    TEST_MSG
  );

  logger.success("Receipt sent");
  logger.log(`ism addr[${HYP_MULTSIG_ISM_FACTORY}]`);
  logger.log(`mailbox addr[${HYP_MAILBOX}]`);
  logger.notice(`receipt addr[${recipientAddr}]`);
}

main(process.argv.slice(2).toString())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
