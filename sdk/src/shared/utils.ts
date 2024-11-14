import { fromBech32 } from "@cosmjs/encoding";
import type { IndexedTx } from "@cosmjs/stargate";
import { StargateClient } from "@cosmjs/stargate";

import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
  Slip10,
  Slip10Curve,
} from "@cosmjs/crypto";

import type { HdPath } from "@cosmjs/crypto";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const addPad = (v: string): string => {
  const s = v.startsWith("0x") ? v.slice(2) : v;
  return s.padStart(64, "0");
};

export const extractByte32AddrFromBech32 = (addr: string): string => {
  const { data } = fromBech32(addr);
  const hexed = Buffer.from(data).toString("hex");
  return `0x${hexed.length === 64 ? hexed : addPad(hexed)}`;
};

export const waitTx = async (
  txHash: string,
  client: StargateClient,
  { waitMs, tryCount }: { waitMs: number; tryCount: number } = {
    waitMs: 1000,
    tryCount: 30,
  }
): Promise<IndexedTx> => {
  let found: IndexedTx | null = null;
  let count = 0;
  while (!found) {
    found = await client.getTx(txHash);
    count++;
    await sleep(waitMs); // default to 1s

    if (count > tryCount) {
      throw new Error(
        `max try count exceeded. count: ${tryCount}, waitMs: ${waitMs}`
      );
    }
  }
  return found;
};

export const getKeyPair = async (
  mnemonic: string,
  hdPath: HdPath,
  password?: string
) => {
  const { privkey } = Slip10.derivePath(
    Slip10Curve.Secp256k1,
    await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic), password),
    hdPath
  );
  const { pubkey } = await Secp256k1.makeKeypair(privkey);
  const result = { privkey, pubkey: Secp256k1.compressPubkey(pubkey) };
  return result;
};
