import {
  CosmosClient,
  instantiateCosmosContract,
  executeCosmosContract,
  upload,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";
import { coin } from "@cosmjs/stargate";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";

const logger = new Logger("hpl_warp_native_cosmos");

export async function deployHypWarpNative(
  client: CosmosClient,
  contract_name: string
): Promise<number> {
  return await upload(client, contract_name);
}

export async function InstantiateHypWarpNative(
  client: CosmosClient,
  codeId: number,
  initMsg: JsonObject
): Promise<string> {
  const instantiate = await instantiateCosmosContract(
    client,
    "hpl_warp_native",
    codeId,
    initMsg
  );

  logger.success(instantiate.address);
  return instantiate.address;
}

export async function setInterchainSecurityModule(
  client: CosmosClient,
  contractAddr: string,
  ismAddr: string | undefined
) {
  // register ism address in the warp contract
  const msg = {
    connection: {
      set_ism: {
        ism: ismAddr,
      },
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_warp_native",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function setMailbox(
  client: CosmosClient,
  contractAddr: string,
  mailboxAddr: string
) {
  // register ism address in the warp contract
  const msg = {
    connection: {
      set_mailbox: {
        mailbox: mailboxAddr,
      },
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_warp_native",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function setHook(
  client: CosmosClient,
  contractAddr: string,
  hookAddr: string | undefined
) {
  // register ism address in the warp contract
  const msg = {
    connection: {
      set_hook: {
        hook: hookAddr,
      },
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_warp_native",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function setRoute(
  client: CosmosClient,
  contractAddr: string,
  destination_domain: number,
  destination_route: string
) {
  const msg = {
    router: {
      set_route: {
        set: {
          domain: destination_domain,
          route: addPad(destination_route),
        },
      },
    },
  };

  const res = await executeCosmosContract(
    client,
    "hpl_warp_native",
    contractAddr,
    msg,
    undefined
  );
  return res;
}

export async function CwTransfer(
  client: CosmosClient,
  contractAddr: string,
  destination_domain: number,
  amount: number,
  fee: number
) {
  // send 1000ustars fee 50ustars
  const funds = [
    coin(amount, client.network.gas.denom),
    coin(fee, client.network.gas.denom),
  ];
  const recipient = `${addPad(
    extractByte32AddrFromBech32(client.signer.address)
  )}`;

  // const recipient =
  //   "00000000000000000000000074d23ca0c791199073e7cea4865ef023b447cd54";

  console.log(client.signer_eth_addr);
  const msg = {
    transfer_remote: {
      dest_domain: destination_domain,
      recipient,
      amount: `${amount}`,
    },
  };
  console.log(JSON.stringify(msg, null, 2));
  console.log(`funds: ${JSON.stringify(funds, null, 2)}`);
  const res = await executeCosmosContract(
    client,
    "hpl_warp_native",
    contractAddr,
    msg,
    funds
  );
  return res;
}

export async function queryStatus(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  logger.info(`Warp Native [${cw_warp_route_addr}] Status: `);
  logger.separator();
  logger.json(await queryTokenType(cw_client, cw_warp_route_addr));
  logger.json(await queryTokenMode(cw_client, cw_warp_route_addr));
  logger.json(await queryMailbox(cw_client, cw_warp_route_addr));
  logger.json(await queryHook(cw_client, cw_warp_route_addr));
  logger.json(await queryIsm(cw_client, cw_warp_route_addr));
  logger.json(await queryDomains(cw_client, cw_warp_route_addr));
  logger.json(await queryRoutes(cw_client, cw_warp_route_addr));
  logger.separator();
}

export async function queryTokenType(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { token_default: { token_type: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryTokenMode(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { token_default: { token_mode: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryMailbox(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { connection: { get_mailbox: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryHook(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { connection: { get_hook: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryIsm(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { connection: { get_ism: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryDomains(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { router: { domains: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryRoute(
  cw_client: CosmosClient,
  cw_warp_route_addr: string,
  domain: number
) {
  const msg = { router: { get_route: { domain } } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}

export async function queryRoutes(
  cw_client: CosmosClient,
  cw_warp_route_addr: string
) {
  const msg = { router: { list_routes: {} } };
  let res: JsonObject = await wasmQuery(cw_client, cw_warp_route_addr, msg);
  return res;
}
