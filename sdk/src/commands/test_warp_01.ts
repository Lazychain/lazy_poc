// WARP LAZY <--> Stargaze
import colors from "colors";

import { Command } from "commander";
import { Logger } from "../shared/logger";
import { EthClient } from "@shared/eth_client";

import type { Contract } from "ethers";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";
import { CosmosClient, getCosmosClient } from "@shared/cosmos_client";
import {
  deployHypWarpNative,
  InstantiateHypWarpNative,
  setInterchainSecurityModule,
  setRoute,
  CwTransfer,
  setMailbox,
  setHook,
  queryStatus,
} from "../cosmos_contracts/hpl_warp_native";
import {
  queryMailboxLatestDispathId,
  queryMailboxStatus,
} from "../cosmos_contracts/hlp_mailbox";
import { queryFeeHookStatus } from "../cosmos_contracts/hlp_hook_fee";
import { queryAggregateHookStatus } from "../cosmos_contracts/hpl_hook_aggregate";
import {
  queryIGPOracleExchangeRateAndGasPrice,
  queryIGPStatus,
} from "../cosmos_contracts/hpl_igp";
import { queryIGPOracleOracleExchangeRateAndGasPrice } from "../cosmos_contracts/hpl_igp_oracle";
import { getNetwork, type NetworksConfig } from "@shared/config/network";
import { getToken, type TokenList } from "@shared/config/token";
import { getBridge, type BridgesConfig } from "@shared/config/bridge";
import { HypERC20 } from "@eth_contracts/erc20";

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
    const lazyWarpRouteContract: Contract = await init_lazy_side(eth_client);
    logger.success(
      `Lazy Token Warp Route Addr[${lazyWarpRouteContract.address}]`
    );

    logger.info("2. Deploying Token Warp Route on stargaze chain");

    const stargazeWarpRouteContract = await init_stargaze_side(cw_client);
    logger.success(
      `Stargaze Token Warp Route Addr[${stargazeWarpRouteContract}]`
    );

    logger.info("3. Register Stargaze destination on lazy warp route.");
    await linkWarpRouteLazySide(
      lazyWarpRouteContract, // warp route contract
      stargaze.domain, // destination domain
      stargazeWarpRouteContract // destination stargaze
    );

    logger.info("4. Register lazy destination on stargaze route.");
    await linkWarpRouteStargazeSide(
      cw_client,
      stargazeWarpRouteContract, // warp route contract
      lazy.domain, // destination domain
      lazyWarpRouteContract.address // destination lazy
    );

    // await queryMailboxRecipientIsm(
    //   cw_client,
    //   bridge.stargaze.mailbox_cosmos,
    //   bridge.lazy.staticAggregationIsmFactory
    // );

    logger.info("5. Test transfer from Stargaze to Lazy");
    await testTransferFromCwToEth(
      cw_client,
      stargazeWarpRouteContract,
      lazy.domain
    );
  });

async function init_stargaze_side(client: CosmosClient): Promise<string> {
  const token: TokenList["tokens"][number] = getToken(CHAIN_B);
  const networkConfig: NetworksConfig["networks"][number] = getNetwork(CHAIN_B);
  const bridge: BridgesConfig["bridges"][number] = getBridge(BRIDGE_ID);

  const codeId = await deployHypWarpNative(client, "hpl_warp_native");

  // https://github.com/many-things/cw-hyperlane/blob/main/packages/interface/src/warp/native.rs#L46-L53
  // token: TokenModeMsg<NativeModeBriged, NativeModeCollateral>,
  const initMsg = {
    token: token.config,
    hrp: networkConfig.hrp,
    owner: client.signer.address,
    mailbox: bridge.stargaze.mailbox,
  };

  const contract_addr = await InstantiateHypWarpNative(client, codeId, initMsg);

  await setInterchainSecurityModule(
    client,
    contract_addr,
    bridge.stargaze.hpl_ism_multisig
  );

  if (bridge.stargaze.mailbox !== undefined) {
    await setMailbox(client, contract_addr, bridge.stargaze.mailbox);
  }

  console.log(bridge.stargaze.staticAggregationHookFactory);
  await setHook(client, contract_addr, bridge.stargaze.hpl_hook_aggregate);

  return contract_addr;
}

async function init_lazy_side(client: EthClient): Promise<Contract> {
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
  const HypERC20Inst = hypERC20.getContract();
  const HypERC20WithSigner = HypERC20Inst.connect(client.signer);
  return HypERC20WithSigner;
}

async function linkWarpRouteLazySide(
  hypERC20ContractWithSigner: Contract, // address of warp route
  destination_domain: number, // destination domain to set
  destination_route: string // destination address to set
) {
  // link
  const router = `0x${addPad(extractByte32AddrFromBech32(destination_route))}`;
  logger.log(
    `enrollRemoteRouter: destination_domain: ${destination_domain} destination_route: ${router}`
  );
  let txr = await hypERC20ContractWithSigner.enrollRemoteRouter(
    destination_domain,
    router
  );
  await txr.wait();
}

async function linkWarpRouteStargazeSide(
  client: CosmosClient,
  contract_addr: string, // address of warp route
  destination_domain: number, // destination domain to set
  destination_route: string // destination address to set
) {
  const res = await setRoute(
    client,
    contract_addr,
    destination_domain,
    destination_route
  );
}

async function testTransferFromCwToEth(
  cw_client: CosmosClient,
  cw_warp_route_addr: string,
  destination_domain: number
) {
  const bridge: BridgesConfig["bridges"][number] = getBridge(BRIDGE_ID);
  await queryMailboxStatus(cw_client, bridge.stargaze.mailbox);
  await queryStatus(cw_client, cw_warp_route_addr);
  await queryAggregateHookStatus(cw_client, bridge.stargaze.hpl_hook_aggregate);
  await queryFeeHookStatus(cw_client, bridge.stargaze.hpl_hook_fee);
  await queryIGPStatus(cw_client, bridge.stargaze.hpl_igp);

  logger.json(
    await queryIGPOracleOracleExchangeRateAndGasPrice(
      cw_client,
      bridge.stargaze.hpl_igp_oracle,
      destination_domain
    )
  );

  logger.json(
    await queryIGPOracleExchangeRateAndGasPrice(
      cw_client,
      bridge.stargaze.hpl_igp,
      destination_domain
    )
  );

  await CwTransfer(
    cw_client,
    cw_warp_route_addr,
    destination_domain,
    1000,
    1000
  );

  logger.info(
    await queryMailboxLatestDispathId(cw_client, bridge.stargaze.mailbox)
  );
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
