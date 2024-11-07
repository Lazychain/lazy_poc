import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
  Slip10,
  Slip10Curve,
  keccak256,
  type HdPath,
} from "@cosmjs/crypto";

import { fromBech32 } from "@cosmjs/encoding";

async function getKeyPair(mnemonic: string, hdPath: HdPath) {
  const { privkey } = Slip10.derivePath(
    Slip10Curve.Secp256k1,
    await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic)),
    hdPath
  );
  const { pubkey } = await Secp256k1.makeKeypair(privkey);
  return { privkey, pubkey: Secp256k1.compressPubkey(pubkey) };
}

export const addPad = (v: string): string => {
  const s = v.startsWith("0x") ? v.slice(2) : v;
  return s.padStart(64, "0");
};

export const extractByte32AddrFromBech32 = (addr: string): string => {
  const { data } = fromBech32(addr);
  const hexed = Buffer.from(data).toString("hex");
  return hexed.length === 64 ? hexed : addPad(hexed);
};
