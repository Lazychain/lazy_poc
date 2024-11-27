import {
  CosmosClient,
  instantiateCosmosContract,
  executeCosmosContract,
  upload,
  wasmQuery,
} from "@shared/cosmos_client";
import { Logger } from "../../shared/logger";
import type { JsonObject } from "@cosmjs/cosmwasm-stargate";
import { coin } from "@cosmjs/stargate";
import { addPad, extractByte32AddrFromBech32 } from "@shared/utils";
import type {
  IHypWarpNative,
  IHypWarpNativeExecute,
  IHypWarpNativeQuery,
} from "../iwarp_native";

const logger = new Logger("hpl_warp_native_cosmos");
const CONTRACT_NAME: string = "hpl_warp_native";

export class HypWarpNative
  implements IHypWarpNative, IHypWarpNativeQuery, IHypWarpNativeExecute
{
  private client: CosmosClient;
  private address: any;

  constructor(client: CosmosClient, address: string) {
    this.client = client;
    this.address = address;
  }
  enrollRemoteRouter(
    destination_domain: number,
    destination_route: string
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async route(domain: number): Promise<any> {
    const msg = { router: { get_route: { domain } } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async tokenType(): Promise<any> {
    const msg = { token_default: { token_type: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async tokenMode(): Promise<any> {
    const msg = { token_default: { token_mode: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async mailbox(): Promise<any> {
    const msg = { connection: { get_mailbox: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async hook(): Promise<any> {
    const msg = { connection: { get_hook: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async ism(): Promise<any> {
    const msg = { connection: { get_ism: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async domains(): Promise<any> {
    const msg = { router: { domains: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async routes(): Promise<any> {
    const msg = { router: { list_routes: {} } };
    let res: JsonObject = await wasmQuery(this.client, this.address, msg);
    return res;
  }
  async setInterchainSecurityModule(ismAddr: string): Promise<any> {
    // register ism address in the warp contract
    const msg = {
      connection: {
        set_ism: {
          ism: ismAddr,
        },
      },
    };

    const res = await executeCosmosContract(
      this.client,
      "hpl_warp_native",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async setMailbox(mailboxAddr: string): Promise<any> {
    // register ism address in the warp contract
    const msg = {
      connection: {
        set_mailbox: {
          mailbox: mailboxAddr,
        },
      },
    };

    const res = await executeCosmosContract(
      this.client,
      "hpl_warp_native",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async setHook(hookAddr: string): Promise<any> {
    // register ism address in the warp contract
    const msg = {
      connection: {
        set_hook: {
          hook: hookAddr,
        },
      },
    };

    const res = await executeCosmosContract(
      this.client,
      "hpl_warp_native",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async setRoute(
    destination_domain: number,
    destination_route: string
  ): Promise<any> {
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
      this.client,
      "hpl_warp_native",
      this.address,
      msg,
      undefined
    );
    return res;
  }
  async transfer(
    destination_domain: number,
    amount: number,
    fee: number
  ): Promise<any> {
    // send 1000ustars fee 50ustars
    const funds = [
      coin(amount, this.client.network.gas.denom),
      coin(fee, this.client.network.gas.denom),
    ];
    const recipient = `${addPad(
      extractByte32AddrFromBech32(this.client.signer.address)
    )}`;

    // const recipient =
    //   "00000000000000000000000074d23ca0c791199073e7cea4865ef023b447cd54";

    console.log(this.client.signer_eth_addr);
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
      this.client,
      "hpl_warp_native",
      this.address,
      msg,
      funds
    );
    return res;
  }

  public static async build(
    client: CosmosClient,
    initMsg: any
  ): Promise<HypWarpNative> {
    const codeId = await this.deploy(client);

    const instantiate = await instantiateCosmosContract(
      client,
      "hpl_warp_native",
      codeId,
      initMsg
    );
    return new HypWarpNative(client, instantiate.address);
  }

  public static async buildFromAlreadyDeployed(
    client: CosmosClient,
    address: string
  ): Promise<HypWarpNative> {
    return new HypWarpNative(client, address);
  }

  public static async deploy(client: CosmosClient): Promise<number> {
    return await upload(client, CONTRACT_NAME);
  }

  addr(): string {
    return this.address;
  }
  async status(): Promise<void> {
    logger.info(`Warp Native [${this.address}] Status: `);
    logger.separator();
    logger.json(await this.tokenType());
    logger.json(await this.tokenMode());
    logger.json(await this.mailbox());
    logger.json(await this.hook());
    logger.json(await this.ism());
    logger.json(await this.domains());
    logger.json(await this.routes());
    logger.separator();
  }
}
