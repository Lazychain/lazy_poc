import { Secp256k1, keccak256 } from "@cosmjs/crypto";

// bip39
import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// ethereum
import { Wallet } from "ethers";
import { Wallet as ETHWallet } from "@ethereumjs/wallet";

import fs from "fs";

// Cosmos
import {
  DirectSecp256k1HdWallet,
  makeCosmoshubPath,
} from "@cosmjs/proto-signing";

import { StargateClient } from "@cosmjs/stargate";

import Web3 from "web3";
import { getKeyPair } from "./utils";

export function createMnemonic() {
  const strength = 256; // 256 bits, 24 words; default is 128 bits, 12 words
  const mnemonic = generateMnemonic(wordlist, strength);
  validateMnemonic(mnemonic, wordlist);
  return mnemonic;
}
export async function ethWalletFromMnemonic(
  mnemonic: string,
  save_keyfile = false
) {
  if (mnemonic == "") {
    const strength = 256; // 256 bits, 24 words; default is 128 bits, 12 words
    mnemonic = generateMnemonic(wordlist, strength);
    validateMnemonic(mnemonic, wordlist);
  }
  mnemonic = mnemonic.replaceAll(",", " ");
  if (mnemonic.split(" ").length > 23) {
    // 1. Private key of 64 (hex) characters (256 bits / 32 bytes) is generated from mnemonic phrase
    // 2. A 128 (hex) character (64 bytes) public key is then derived from the generated private key using Elliptic Curve Digital Signature Algorithm (ECDSA).
    // 3. The Keccak-256 hash function is then applied to (128 characters / 64 bytes) the public key to obtain a 64 character (32 bytes) hash string. The last 40 characters / 20 bytes of this string prefixed with 0x become the final Ethereum address.
    const eth_wallet = Wallet.fromMnemonic(mnemonic);

    if (save_keyfile == true) {
      var account = ETHWallet.fromPrivateKey(
        Buffer.from(eth_wallet.privateKey.replace("0x", ""), "hex")
      );
      const content = JSON.stringify(await account.toV3(""));
      const file = `UTC--${new Date().toISOString().replace(/[:]/g, "-")}--${
        eth_wallet.address
      }`;
      // writes to a file
      console.log(`Saving file to [${file}]`);
      fs.writeFileSync(`${file}`, content);
    }

    return {
      mnemonic: mnemonic,
      privateKeyHex: eth_wallet.privateKey,
      publicKeyHex: eth_wallet.publicKey,
      address: eth_wallet.address,
    };
  } else {
    throw new Error(
      "Please provide a 24 phrase words or leave empty to generate a random wallet."
    );
  }
}

export async function cosmosWalletFromMnemonic(
  mnemonic: string,
  prefix: string = "stars"
) {
  if (mnemonic == "") {
    const strength = 256; // 256 bits, 24 words; default is 128 bits, 12 words
    mnemonic = generateMnemonic(wordlist, strength);
    validateMnemonic(mnemonic, wordlist);
  }
  mnemonic = mnemonic.replaceAll(",", " ");
  if (mnemonic.split(" ").length > 23) {
    // BIP44
    const stargaze_wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      {
        prefix: prefix,
      }
    );
    // BIP32
    const [account] = await stargaze_wallet.getAccounts();
    const { privkey } = await getKeyPair(
      stargaze_wallet.mnemonic,
      makeCosmoshubPath(0)
    );
    const pubkey = Secp256k1.uncompressPubkey(account.pubkey);
    const ethaddr = keccak256(pubkey.slice(1)).slice(-20);

    return {
      mnemonic: mnemonic,
      publicKeyHex: "0x" + Buffer.from(account.pubkey).toString("hex"),
      privateKeyHex: "0x" + Buffer.from(privkey).toString("hex"),
      ethAddrHex: Buffer.from(ethaddr).toString("hex"),
      address: account.address,
    };
  } else {
    throw new Error(
      "Please provide a 24 phrase words or leave empty to generate a random wallet."
    );
  }
}

export async function cosmosWalletBalance(address: string, port = "26657") {
  const client = await StargateClient.connect(`http://127.0.0.1:${port}`);
  return await client.getAllBalances(address);
}

export async function ethWalletBalance(address: string, port = "8545") {
  const url = `http://127.0.0.1:${port}`;
  console.log(url);
  let web3 = new Web3(url);
  // const sender = web3.eth.accounts.privateKeyToAccount(eth_wallet.privateKey);
  // web3.eth.accounts.wallet.add(sender.privateKey);
  return web3.utils.fromWei(await web3.eth.getBalance(address), "ether");
}
