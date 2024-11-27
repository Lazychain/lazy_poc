// WARP LAZY <--> Stargaze
import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";

import { CosmosClient, getCosmosClient } from "@shared/cosmos_client";
import { getNetwork, type NetworksConfig } from "@shared/config/network";
import { getToken, type TokenList } from "@shared/config/token";
import { getBridge, type BridgesConfig } from "@shared/config/bridge";
import { HypERC20 } from "../contracts/eth_contracts/erc20";

import { queryIGPOracleOracleExchangeRateAndGasPrice } from "@cw_contracts/hpl_igp_oracle";
import { HypCosmosMailbox } from "@cw_contracts/hlp_mailbox";
import { HypHookFees } from "@cw_contracts/hlp_hook_fee";
import { HypHookAggregate } from "@cw_contracts/hpl_hook_aggregate";
import { HypIgp } from "@cw_contracts/hpl_igp";
import { HypWarpNative } from "@cw_contracts/hpl_warp_native";

colors.enable();
const logger = new Logger("test-warp-01");

// staticMessageIdMultisigIsmFactory: 0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7
// export const HYP_CW20 = "star....";
// export const COSMOS_CHAIN_DOMAIN = 7865; // stargaze
// export const ROUTE = "star...";

const BRIDGE_ID = "lazy_stargaze";
const CHAIN_A = "lazy";
const CHAIN_B = "stargaze";

export const testWarp01Cmd = new Command("test-warp-01")
  .configureHelp({
    showGlobalOptions: true,
  })
  .argument("<mnemonic>", "mnemonic")
  .action(async (mnemonic) => {
    const eth_client = new EthClient(CHAIN_A, mnemonic);
    const cw_client: CosmosClient = await getCosmosClient(CHAIN_B, mnemonic);
    const stargaze: NetworksConfig["networks"][number] = getNetwork(CHAIN_B);
    const lazy: NetworksConfig["networks"][number] = getNetwork(CHAIN_A);

    logger.info("1. Deploying Token Warp Route on Lazy chain");
    const lazyWarpRoute: HypERC20 = await init_lazy_side(eth_client);
    logger.success(`Lazy Token Warp Route Addr[${lazyWarpRoute.addr()}]`);

    logger.info("2. Deploying Token Warp Route on stargaze chain");

    const stargazeWarpRoute: HypWarpNative = await init_stargaze_side(
      cw_client
    );
    logger.success(
      `Stargaze Token Warp Route Addr[${stargazeWarpRoute.addr()}]`
    );

    logger.info("3. Register Stargaze destination on lazy warp route.");
    await stargazeWarpRoute.enrollRemoteRouter(
      stargaze.domain, // destination domain
      stargazeWarpRoute.addr() // destination stargaze
    );

    logger.info("4. Register lazy destination on stargaze route.");
    await stargazeWarpRoute.setRoute(
      lazy.domain, // destination domain
      lazyWarpRoute.addr() // destination lazy
    );

    // await queryMailboxRecipientIsm(
    //   cw_client,
    //   bridge.stargaze.mailbox_cosmos,
    //   bridge.lazy.staticAggregationIsmFactory
    // );

    logger.info("5. Test transfer from Stargaze to Lazy");
    await testTransferFromCwToEth(cw_client, stargazeWarpRoute, lazy.domain);
  });

async function init_stargaze_side(
  client: CosmosClient
): Promise<HypWarpNative> {
  const token: TokenList["tokens"][number] = getToken(CHAIN_B);
  const networkConfig: NetworksConfig["networks"][number] = getNetwork(CHAIN_B);
  const bridge: BridgesConfig["bridges"][number] = getBridge(BRIDGE_ID);

  // https://github.com/many-things/cw-hyperlane/blob/main/packages/interface/src/warp/native.rs#L46-L53
  // token: TokenModeMsg<NativeModeBriged, NativeModeCollateral>,
  const initMsg = {
    token: token.config,
    hrp: networkConfig.hrp,
    owner: client.signer.address,
    mailbox: bridge.stargaze.mailbox,
  };

  const nativeWarp: HypWarpNative = await HypWarpNative.build(client, initMsg);

  await nativeWarp.setInterchainSecurityModule(
    bridge.stargaze.hpl_ism_multisig!
  );

  await nativeWarp.setMailbox(bridge.stargaze.mailbox!);

  console.log(bridge.stargaze.staticAggregationHookFactory);
  await nativeWarp.setHook(bridge.stargaze.hpl_hook_aggregate!);

  return nativeWarp;
}

async function init_lazy_side(client: EthClient): Promise<HypERC20> {
  const bridge: BridgesConfig["bridges"][number] = getBridge(BRIDGE_ID);
  const mailboxAddr = bridge.lazy.mailbox;
  const multisigIsmFactoryAddr = bridge.lazy.staticMessageIdMultisigIsmFactory;
  const hookfactoryAddr = bridge.lazy.staticAggregationHookFactory;

  const hypERC20: HypERC20 = await HypERC20.build(client.signer, mailboxAddr);
  await hypERC20.initialize(hookfactoryAddr, multisigIsmFactoryAddr);

  // logger.info("Binding the contract to ism");
  // await executeERC20_setInterchainSecurityModule(
  //   client.signer,
  //   hypErc20Addr,
  //   multi_ism_factory_addr
  // );
  return hypERC20;
}

async function testTransferFromCwToEth(
  cw_client: CosmosClient,
  cw_warp_route: HypWarpNative,
  destination_domain: number
) {
  const bridge: BridgesConfig["bridges"][number] = getBridge(BRIDGE_ID);
  const mailbox: HypCosmosMailbox = new HypCosmosMailbox(
    cw_client,
    bridge.stargaze.mailbox
  );
  const hookFees: HypHookFees = new HypHookFees(
    cw_client,
    bridge.stargaze.hpl_hook_fee!
  );
  const hookAggregate: HypHookAggregate = new HypHookAggregate(
    cw_client,
    bridge.stargaze.hpl_hook_fee!
  );
  const igp: HypIgp = new HypIgp(cw_client, bridge.stargaze.hpl_igp!);

  await mailbox.status();
  await cw_warp_route.status();
  await hookAggregate.status();
  await hookFees.status();
  await igp.status();

  logger.json(
    await queryIGPOracleOracleExchangeRateAndGasPrice(
      cw_client,
      bridge.stargaze.hpl_igp_oracle,
      destination_domain
    )
  );

  logger.json(await igp.oracleExchangeRateAndGasPrice(destination_domain));

  await cw_warp_route.transfer(destination_domain, 1000, 1000);

  logger.info(await mailbox.latestDispathId());
}

// async function testTransferFromEthToCw(
//   hypERC20ContractWithSigner: Contract, // address of warp route
//   destination_domain: number
// ) {
//   await hypERC20ContractWithSigner.EthTransfer(
//     hypERC20ContractWithSigner,
//     destination_domain,
//     1000,
//     50
//   );
// }

// async function transferhypERC20(
//   hypERC20ContractWithSigner: Contract,
//   domain: number,
//   hypCW20Addr: string
// ) {
//   // Transfer ERC20 to cosmos blockchain
//   let txr = await hypERC20ContractWithSigner.transferRemote(
//     domain,
//     `0x${extractByte32AddrFromBech32(hypCW20Addr)}`,
//     1_000_000n
//   );
//   await txr.wait();
//   logger.log(`Transaction hash: ${JSON.stringify(txr)}`);
// }
