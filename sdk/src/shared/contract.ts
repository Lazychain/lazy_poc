import type { IndexedTx } from "@cosmjs/stargate";

import { Client } from "./config";
import { contractNames } from "./constants";
import { Context } from "./context";
import { Logger } from "./logger";
import { extractByte32AddrFromBech32, sleep, waitTx } from "./utils";

const logger = new Logger("contract");

export type ContractNames = (typeof contractNames)[number];

export async function deployContract<T extends ContractNames>(
  ctx: Context,
  client: Client,
  contractName: T,
  initMsg: object,
  retryAfter = 1000
): Promise<{ type: T; address: string; hexed: string }> {
  const { wasm, stargate, signer } = client;

  try {
    const codeId = ctx.artifacts[contractName];
    const res = await wasm.instantiate(
      signer,
      codeId,
      initMsg,
      `cw-hpl: ${contractName}`,
      "auto"
    );
    const receipt = await waitTx(res.transactionHash, stargate);
    if (receipt.code > 0) {
      logger.error(
        "deploy tx failed.",
        `contract=${contractName}, hash=${receipt.hash}`
      );
      throw new Error(JSON.stringify(receipt.events, null, 2));
    }

    logger.json(
      `I ${contractName}: ${JSON.stringify(initMsg, null, 2)} -> [${
        res.contractAddress
      }]`
    );
    return {
      type: contractName,
      address: res.contractAddress,
      hexed: extractByte32AddrFromBech32(res.contractAddress),
    };
  } catch (e) {
    logger.error(`failed to deploy contract. retrying after ${retryAfter}ms`);
    logger.error("=> error: ", e);
    await sleep(retryAfter);
    return deployContract(ctx, client, contractName, initMsg, retryAfter * 2);
  }
}

export async function executeContract(
  { wasm, stargate, signer }: Client,
  deployment: { type: ContractNames; address: string },
  msg: object,
  funds: { amount: string; denom: string }[] = []
): Promise<IndexedTx> {
  console.log(JSON.stringify(signer));
  const res = await wasm.execute(
    signer,
    deployment.address,
    msg,
    "auto",
    "test",
    funds
  );
  const receipt = await waitTx(res.transactionHash, stargate);
  if (receipt.code > 0) {
    logger.error(
      "execute tx failed.",
      `contract=${deployment.type}, hash=${receipt.hash}`
    );
    throw new Error(JSON.stringify(receipt.events));
  }

  logger.json(
    `X ${deployment.type}: ${JSON.stringify(msg, null, 2)} -> [${receipt}]`
  );

  return receipt;
}

export async function executeMultiMsg(
  { wasm, stargate, signer }: Client,
  msgs: { contract: { type: ContractNames; address: string }; msg: object }[]
): Promise<IndexedTx> {
  msgs.map((v) => logger.json(JSON.stringify(v, null, 2)));

  const res = await wasm.executeMultiple(
    signer,
    msgs.map((v) => ({
      contractAddress: v.contract.address,
      msg: v.msg,
    })),
    "auto"
  );
  const receipt: IndexedTx = await waitTx(res.transactionHash, stargate);
  if (receipt.code > 0) {
    logger.error(
      `execute multiple tx failed.`,
      `msgs=${msgs.length}, hash=${receipt.hash}`
    );
    throw new Error(JSON.stringify(receipt.events, null, 2));
  }

  msgs.forEach((element) => {
    logger.json(
      `XMS [${element.contract.type}] MSG[${JSON.stringify(
        element.msg,
        null,
        2
      )}]`
    );
  });

  logger.info(`X -> [${JSON.stringify(receipt.events, null, 2)}]`);

  return receipt;
}
