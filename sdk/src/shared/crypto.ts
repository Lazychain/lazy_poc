import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
  Slip10,
  Slip10Curve,
} from "@cosmjs/crypto";

import type { HdPath } from "@cosmjs/crypto";

import { Logger } from "./logger";

const logger = new Logger("crypto");

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
