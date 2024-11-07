// bip39
import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// ethereum
import { Wallet } from "ethers";

// Cosmos
import {
  DirectSecp256k1HdWallet,
  makeCosmoshubPath,
} from "@cosmjs/proto-signing";

import { StargateClient } from "@cosmjs/stargate";

import { Secp256k1, keccak256 } from "@cosmjs/crypto";

import { getKeyPair } from "@shared/crypto";
import Web3 from "web3";

async function main() {
  let mnemonic = process.argv.slice(2).toString();
  if (mnemonic == "") {
    const strength = 256; // 256 bits, 24 words; default is 128 bits, 12 words
    mnemonic = generateMnemonic(wordlist, strength);
    validateMnemonic(mnemonic, wordlist);
  }

  //console.log("Mnemonic:", mnemonic);

  // 1. Private key of 64 (hex) characters (256 bits / 32 bytes) is generated from mnemonic phrase
  // 2. A 128 (hex) character (64 bytes) public key is then derived from the generated private key using Elliptic Curve Digital Signature Algorithm (ECDSA).
  // 3. The Keccak-256 hash function is then applied to (128 characters / 64 bytes) the public key to obtain a 64 character (32 bytes) hash string. The last 40 characters / 20 bytes of this string prefixed with 0x become the final Ethereum address.
  const eth_wallet = Wallet.fromMnemonic(mnemonic);

  // BIP44
  const stargaze_wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "stars",
  });
  // BIP32
  const [account] = await stargaze_wallet.getAccounts();
  const { privkey } = await getKeyPair(
    stargaze_wallet.mnemonic,
    makeCosmoshubPath(0)
  );
  const pubkey = Secp256k1.uncompressPubkey(account.pubkey);
  const ethaddr = keccak256(pubkey.slice(1)).slice(-20);

  // new web3 instance
  let web3 = new Web3("http://127.0.0.1:8545");
  const sender = web3.eth.accounts.privateKeyToAccount(eth_wallet.privateKey);
  web3.eth.accounts.wallet.add(sender.privateKey);
  const eth_balance = web3.utils.fromWei(
    await web3.eth.getBalance(eth_wallet.address),
    "ether"
  );

  const stargaze_rpc = "http://localhost:21657";
  const client = await StargateClient.connect(stargaze_rpc);
  const cosmos_balance = await client.getAllBalances(account.address);

  const stargaze_account = {
    publicKeyHex: "0x" + Buffer.from(account.pubkey).toString("hex"),
    privateKeyHex: "0x" + Buffer.from(privkey).toString("hex"),
    ethAddrHex: Buffer.from(ethaddr).toString("hex"),
    address: account.address,
    balance: cosmos_balance,
  };

  const eth_account = {
    privateKeyHex: eth_wallet.privateKey,
    publicKeyHex: eth_wallet.publicKey,
    address: eth_wallet.address,
    balance: eth_balance,
  };

  console.log(
    JSON.stringify({
      mnemonic: mnemonic,
      eth: eth_account,
      stargaze: stargaze_account,
    })
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
