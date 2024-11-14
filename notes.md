# Journal

## Install kurtosis

[kurtosis](https://docs.kurtosis.com/install/)

## Install Nix and flakes

`sh <(curl -L https://nixos.org/nix/install) --no-daemon`

stargaze: `nix run github:unionlabs/union#devnet-stargaze --extra-experimental-features nix-command --extra-experimental-features flakes`

## Install Process Compose

`https://github.com/F1bonacc1/process-compose`

## Install bun

`curl -fsSL https://bun.sh/install | bash`

## Install jq

## Install yq

## Create or import a temporary useless wallet

`bun ./scripts/new_wallet.js` or
`bun ./scripts/new_wallet.js "<MNEMONIC>" | jq .`

This will contain the temporary useless with no real fund private keys for development testing account.

## Prepare blockscout

`git clone https://github.com/blockscout/blockscout.git`
on `docker-compose/envs/` change all ports 8081 to 8082

## Prepare cw-hyperlane

[cw-hyperlane](https://github.com/many-things/cw-hyperlane/tree/main)

```bash
git clone https://github.com/many-things/cw-hyperlane.git && cd cw-hyperlane
make install
make install-dev
```

Note: change Makefile `build: optimize-fast check` for `build: optimize check`

```bash
make build-linux
cargo test --workspace --exclude hpl-tests
cargo llvm-cov --workspace --exclude hpl-tests
```

```bash
yarn install
make optimize
```

## Prepare hyperlane-monorepo

git clone

`bun i -g @hyperlane-xyz/cli@6.0.0`

## Setting up kurtosis e2e poc

clean previous hyperlane setup: `rm -rf ~/.hyperlane/chains/`

1. Run Lazy, stargaze, forma containers
2. Init the hyperlane-lazy connection
3. Deploy lazy-hyperlane contracts
4. Init the hyperlane-stargaze connection
5. Deploy stargaze-hyperlane contracts
6. Setup the hyperlane-validator for Lazy and Stargaze.
7. Setup hyperlane-relayer for Lazy and Stargaze.
8. Make a simple Test.
9. Send STARS token from stargaze to lazy.
10. Send NFT-Base token from stargaze to lazy.

### Run Lazy, stargaze, forma containers

1- Generate `$DEV_MNEMONIC` random wallet: `cd sp2 && bun wallet | jq .`. Take into account the address, private keys, etc to later use.
2- Generate `$VAL_MNEMONIC` random wallet: `cd sp2 && bun wallet | jq .`. Take into account the address, private keys, etc to later use.
3- `export HYP_KEY="..."` and `export VAL_KEY="..."`.
4- Run containers: `kurtosis clean --all && kurtosis run --enclave test . "$(echo { \"DEV_MNEMONIC\": $HYP_KEY, \"VAL_MNEMONIC\": $VAL_KEY})"`.

```json
{
 "blockscout": {
  "explorer": "http://127.0.0.1:8080"
 },
 "hyperlane": {
  "relayer": {
   "grpc": "http://127.0.0.1:8092"
  }
 },
 "lazychain": {
  "contracts": {},
  "dev_wallet": {
   "address": "art1g6zqy2y7hft0cpat7sf6h70s5mdyag2a58d6cr",
   "eth_addr": "312bb42931060d953513de5c1f658f54592bd82650e5a7a6b770d5149c56d86e"
  },
  "grpc": "http://127.0.0.1:9090",
  "json-rpc": "http://127.0.0.1:8545",
  "rest": "http://127.0.0.1:1317",
  "rpc": "http://127.0.0.1:26657",
  "validator_wallet": {
   "address": "art1fugvqxq3fu7jznmu680wq6asda22qa4qcvvy73"
  }
 },
 "stargaze": {
  "contracts": {
   "cw721_base": {
    "addr": "stars14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9srsl6sm",
    "code_id": "1"
   }
  },
  "dev_wallet": {
   "address": "stars15zdpt7vzyp96evgq37hwdkqpr5uw5kk6qj3h4l",
   "eth_addr": "312bb42931060d953513de5c1f658f54592bd82650e5a7a6b770d5149c56d86e"
  },
  "grpc": "http://127.0.0.1:8090",
  "rest": "http://127.0.0.1:1316",
  "rpc": "http://127.0.0.1:21657",
  "validator_wallet": {
   "address": "stars1kjsltyrp8h8f5yz7vmd4d33vunw66tnah7gpt8"
  }
 }
}
```

Check point:

lazy:

- rpc: `curl --silent localhost:26657/status | jq .result.node_info.network` : "artroll_11820-1"
- json-rpc: `curl --silent http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":67}' | jq .result` : "11820"
- json-rpc: `cast client -r http://127.0.0.1:8545` : `<appd>//linux-amd64/go1.22.8`
- grpc: `grpcurl -plaintext 127.0.0.1:8090 list` should response

stargaze:

- rpc: `curl localhost:21657/status | jq .` should response
- grpc: `grpcurl -plaintext 127.0.0.1:8090 list` should response
- rest: `curl --silent http://localhost:1316/cosmos/base/tendermint/v1beta1/blocks/latest | jq .block.header.chain_id` "testing"

Balance:

- balance: `cast balance 0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D` : "100000000000000000000"
- balance: `curl --location http://localhost:1316/cosmos/bank/v1beta1/balances/stars1cmxt3mt7vfcncs64ycsgjvep7xecv0grsr47p3 | jq .balances[0]`

Note:

if we use --coin-type 60 on create_wallet, we should validate this.
`cast wallet private-key "$(echo "$HYP_KEY")"` should be the same as `eth_addr` filed for both lazy and stargaze dev_wallets.

### Init the hyperlane-lazy connection

`hyperlane registry init`

Check point: `cat ~/.hyperlane/chains/lazy/metadata.yaml`

```text
? Detected rpc url as http://localhost:8545 from JSON RPC provider, is this correct? yes
? Enter chain name (one word, lower case) lazy
? Enter chain display name Lazy
? Detected chain id as 11820 from JSON RPC provider, is this correct? yes
? Is this chain a testnet (a chain used for testing & development)? yes
? Do you want to add a block explorer config for this chain yes
? Enter a human readable name for the explorer: lazyscout
? Enter the base URL for the explorer: http://0.0.0.1:8082
? Enter the base URL for requests to the explorer API: http://localhost:8080
? Select the type (family) of block explorer: blockscout
? Optional: Provide an API key for the explorer, or press 'enter' to skip. Please be sure to remove this field if you intend to add your config to the Hyperlane registry:
? Do you want to set block or gas properties for this chain config yes
? Do you want to add block config for this chain no
? Do you want to add gas config for this chain no
? Do you want to set native token properties for this chain config (defaults to ETH) yes
? Enter the native token's symbol: art
? Enter the native token's name: ART
? Enter the native token's decimals: 18
```

Note: json-rpc port is by default 8545 for ethereum.

```yaml
# yaml-language-server: $schema=../schema.json
blockExplorers:
  - apiUrl: http://localhost:8081
    family: blockscout
    name: lazyscout
    url: http://0.0.0.1:8082
chainId: 11820
displayName: Lazy
domainId: 11820
isTestnet: true
name: lazy
nativeToken:
  decimals: 18
  name: ART
  symbol: art
protocol: ethereum
rpcUrls:
  - http: http://localhost:8545
```

`hyperlane core init`

should detect ETH address: `0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D`

Check point: `cat ./configs/core-config.yaml`

```yaml
    owner: "0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D"
    defaultIsm:
      type: trustedRelayerIsm
      relayer: "0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D"
    defaultHook:
      type: merkleTreeHook
    requiredHook:
      owner: "0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D"
      type: protocolFee
      beneficiary: "0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D"
      maxProtocolFee: "100000000000000000"
      protocolFee: "0"
```

maxProtocolFee= 0.1

### Deploy lazy-hyperlane contracts

`hyperlane core deploy --chain lazy --yes`

```text
Hyperlane Core deployment
------------------------------------------------
? Select network type Testnet
? Select chain to connect: lazy
? Do you want to use an API key to verify on this (lazy) chain's block explorer no

Deployment plan
===============
Transaction signer and owner of new contracts: 0xD23625adC93bEE9331A08Dc95a4c1B7711B94e8b
Deploying core contracts to network: lazy
┌────────────────────────┬─────────────────────────┐
│ (index)                │ Values                  │
├────────────────────────┼─────────────────────────┤
│ Name                   │ 'lazy'                  │
│ Display Name           │ 'Lazy'                  │
│ Chain ID               │ 11820                   │
│ Domain ID              │ 11820                   │
│ Protocol               │ 'ethereum'              │
│ JSON RPC URL           │ 'http://localhost:8545' │
│ Native Token: Symbol   │ 'art'                   │
│ Native Token: Name     │ 'ART'                   │
│ Native Token: Decimals │ 18                      │
└────────────────────────┴─────────────────────────┘
```

Check point: `cat ~/.hyperlane/chains/lazy/addresses.yaml | yq`

```json
{
  "domainRoutingIsmFactory": "0xD781Da4ed84470B706f8C6F12a13fa134c5B3d8D",
  "interchainAccountIsm": "0x96B6441a375b0B13E86ba853A542a8D4f8bf0a20",
  "interchainAccountRouter": "0xf7583BdeCf840e60657dd175dc6Ec172269eb8E7",
  "mailbox": "0x067A44Af3D39893Bd783518F6b687d89aed8f9b7",
  "merkleTreeHook": "0x18a2fD5E2791f8D7A87BE15F203ef4840691cd64",
  "proxyAdmin": "0x41F84AB405621BA3560D3E76A2Ae8845568FaCB4",
  "staticAggregationHookFactory": "0xfda383d60569eEC89dC7712D831232B271F59382",
  "staticAggregationIsmFactory": "0x4Abd22724265745B1914816E44619357B5B4dE6B",
  "staticMerkleRootMultisigIsmFactory": "0xfbb15A5773F84cdAe31e60cB0A487381d8D0dC14",
  "staticMerkleRootWeightedMultisigIsmFactory": "0xB0E38fca16B0330e0106BA76433bbf371E716e01",
  "staticMessageIdMultisigIsmFactory": "0x397925Dbfbc3c42f4b3eFa5E11e9B8e7c2B39CC7",
  "staticMessageIdWeightedMultisigIsmFactory": "0x77c8D0636De274A1B84a7bBED3898e839485d3c4",
  "testRecipient": "0xC14d13977d92ce0d6BeEFfDD6EDA179d3F225380",
  "validatorAnnounce": "0x0715Ceaeeb3276516b3ae9061BE74F7cdc433780"
}
```

With this result, update `./src/static_files/hyperlane/config/agent-config.json`

Note: we can commit this to save state, but the image is too big.

`docker commit lazy-local--d586cb62fd714a7aa7e500dedddb84af`
`docker tag 5cfb80b686331827a1242b54aa4cd02ec9a2f17fcee3fb257f6c6eb85de578c8 lazy-local-hyper-deployed`

### Init the hyperlane-stargaze connection

```bash
touch cw_hyperlane/config.yaml
```

 We are going to deploy:

- Interchain Security Module [multisig-ISM](https://docs.hyperlane.xyz/docs/protocol/ISM/multisig-ISM) (compose only by one validator 100 weight).
- [Interchain Gas Payment](https://docs.hyperlane.xyz/docs/protocol/interchain-gas-payment), to pay fees to the relayer using the origin chain token.
- Mailbox merkle proof hook to store the succinct proofs.
- Pausable Hooks to allow Pause the bridge
- Fee Hook to allow paying Gas Fee from the Origin Chain.

```yaml
```

Edit: Note: take into account the `mailbox` from `cat ~/.hyperlane/chains/lazy/addresses.yaml`

### Deploy stargaze-hyperlane contracts

On `cw_hyperlane` folder, run:

```bash
rm -rf ./context/stargaze.*

echo y | yarn cw-hpl upload local -n stargaze --contracts hpl_mailbox hpl_validator_announce hpl_ism_multisig hpl_igp hpl_hook_merkle hpl_test_mock_msg_receiver hpl_test_mock_hook hpl_warp_native hpl_warp_cw20 hpl_hook_pausable hpl_hook_aggregate hpl_igp_oracle hpl_hook_fee

yarn cw-hpl deploy local -n stargaze
```

- stargaze: context + deployment `cat ./context/stargaze.json`
- stargaze: Hyperlane agent-config  `cat ./context/stargaze.config.json`
- lazychain: `cat ~/.hyperlane/chains/lazy/addresses.yaml`

checkpoint:

mailbox: `curl --silent http:/localhost:1316/cosmwasm/wasm/v1/contract/$(cat ./context/stargaze.json | jq .deployments.core.mailbox.address | tr -d '"') | jq .`

`curl http://localhost:1316/cosmwasm/wasm/v1/contract/stars14haqsatfqxh3jgzn6u7ggnece4vhv0nt8a8ml4rg29mln9hdjfdqk4x3zx/smart/$(echo -n '{"mailbox": { "hrp": {} } }' | base64)`
`curl http://localhost:1316/cosmwasm/wasm/v1/contract/stars14haqsatfqxh3jgzn6u7ggnece4vhv0nt8a8ml4rg29mln9hdjfdqk4x3zx/smart/$(echo -n '{"mailbox": { "local_domain": {} } }' | base64)`

### Setup manually the stargaze validator anonounce

1- get `<validator>`
`stargaze.ethAddrHex`

2- Get `<signature>`

`cat /etc/validator/stargaze/checkpoint/announcement.json`

```json
serialized_signature: "0x<signature>
```

3-  Execute

```bash
starsd tx wasm execute <validator_announce.address> '{"announce": { "validator": "<validator>", "storage_location": "file:///etc/validator/stargaze/checkpoint", "signature": "<signature>" } }' --keyring-backend test --fees 75000ustars --from dev01 --output json
```

```json
{"height":"0","txhash":"B0D20F7C289AA63D78B66952A1F78E871727FE507C1F3E061DE9B9352E219211","codespace":"","code":0,"data":"","raw_log":"[]","logs":[],"info":"","gas_wanted":"0","gas_used":"0","tx":null,"timestamp":"","events":[]}
```

```bash
starsd q tx B0D20F7C289AA63D78B66952A1F78E871727FE507C1F3E061DE9B9352E219211
```

### Configure Hyperlane Relayer and agents

With the information on the kurtosis server and the generated by cw-hyperlane and hyperlane, we proceed to update `static_files/hyperlane` directory files `agent-config.json`,`relayer.json`,`validator.lazy.json`,`validator.stargaze.json`.

`docker compose rm --force && docker compose up`

`apt-get update && apt-get install curl jq --yes`
`curl host.docker.internal:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":67}' | jq .` json-rpc lazy
`curl host.docker.internal:26657/status | jq .` rpc-lazy
`curl host.docker.internal:21657/status | jq .` rpc-stargaze

### Test

## 5. Deploy Test contracts on Lazychain

```bash
cd sp2
bun cw-hpl-exp deploy-test-recipient <eth.privateKeyHex>
```

## 6. Run Messaging Test

### Lazychain -> stargaze

```bash
bun test01 \"$(echo $HYP_KEY)\"
```

### stargaze -> Lazychain

```bash
# [dest-domain] [recipient-address] [message]
bun cw-hpl contract test-dispatch -n stargzae 11820 0x8E559E6f6Bf5F464644719FfD65b8E7c4f7F4402 hello
```

## 7. Warp Route

```bash
# deploy warp route on sepolia
yarn cw-hpl-exp warp deploy --pk 'YOUR_PRIVATE_KEY'

# then output will like this
{ "hypErc20Osmo": "0x..." }

# deploy warp route on stargaze
yarn cw-hpl warp create ./src/static_files/hyperlane/warp/ustar.json -n stargaze

# register stargaze warp route to lazychain warp route
yarn cw-hpl-exp warp link $hypErc20Osmo 7865 $OSMOSIS_WARP_ROUTE_ADDRESS --pk 'YOUR_PRIVATE_KEY'

# also register lazychain warp route to stargaze warp route
yarn cw-hpl warp link \
  --asset-type native \
  --asset-id ustars \
  --target-domain 11820 \
  --warp-address $hypErc20Osmo \
  -n stargaze

# test transfer
yarn cw-hpl warp transfer \
  --asset-type native \
  --asset-id ustars \
  --target-domain 11820 \
  -n stargaze
```
