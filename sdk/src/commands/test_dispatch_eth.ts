import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";
import { HypEthMailbox } from "../contracts/eth_contracts/mailbox";
import { TestEthRecipient } from "../contracts/eth_contracts/recipient";

colors.enable();
const logger = new Logger("test-dispatch");

// staticMessageIdMultisigIsmFactory: 0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7
export const HYP_ETH_MULTSIG_ISM_FACTORY =
  "0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7";
export const HYP_ETH_MAILBOX = "0x067A44Af3D39893Bd783518F6b687d89aed8f9b7";
export const COSMOS_CHAIN_DOMAIN = 7865; // stargaze
const TEST_MSG_HEX = "0x68656c6c6f";
const COSMOS_RECEIPT_ADDRESS =
  "0x31d0e9bf5f3d00ff9278278506e4e21367439eca6e2cf7f4f2d7ec1191b8e2dc";

export const testDispatchEthCmd = new Command("test-dispatch-eth")
  .description("lazychain->stargaze")
  .configureHelp({
    showGlobalOptions: true,
  })
  .argument("<networkId>", "network Id")
  .argument("<mnemonic>", "mnemonic")
  .action(async (networkId, mnemonic) => {
    const client = new EthClient(networkId, mnemonic);

    // if we need to create and deploy new contracts

    //const ismAddr = await deployISM(signer);
    //const mailboxAddr = await deployMailbox(signer, COSMOS_CHAIN_DOMAIN);
    //const ismAddr = getISMContract(signer, HYP_MULTSIG_ISM_FACTORY).address;
    //const mailbox = getMailboxContract(HYP_MAILBOX);
    //await executeMailbox_setDefaultIsm(signer, mailboxAddr, ismAddr);

    // We are going to use an already deployed mailbox
    const mailbox = await HypEthMailbox.buildFromAlreadyDeployed(
      client.signer,
      HYP_ETH_MAILBOX,
      client.networkConfig.domain
    );

    // Some validations

    // await queryISM_getSignerAddress(signer, HYP_MULTSIG_ISM_FACTORY);
    // await queryMailbox_defaultIsm(mailbox);
    // await queryMailbox_localDomain(mailbox);
    // await queryMailbox_recipientIsm(mailbox, HYP_MULTSIG_ISM_FACTORY);

    const testRecipient: TestEthRecipient = await TestEthRecipient.build(
      client.signer
    );

    await testRecipient.setInterchainSecurityModule(
      HYP_ETH_MULTSIG_ISM_FACTORY
    );
    await mailbox.dispatch(
      COSMOS_CHAIN_DOMAIN,
      COSMOS_RECEIPT_ADDRESS,
      TEST_MSG_HEX
    );

    logger.success("Receipt sent");
    logger.log(`ism addr[${HYP_ETH_MULTSIG_ISM_FACTORY}]`);
    logger.log(`mailbox addr[${HYP_ETH_MAILBOX}]`);
    logger.notice(`smart contract receipt addr[${testRecipient.addr()}]`);
  });
