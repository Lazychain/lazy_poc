#!/bin/sh
KEY="validator"
KEY_MNEMONICS=$(echo "$VAL_MNEMONIC")
KEYRING="test"
MONIKER="startestnet"

CHAINID=${CHAINID:-testing}
DENOM=${DENOM:-ustars}
BLOCK_GAS_LIMIT=${GAS_LIMIT:-75000000}
WORKDIR="$HOME/.starsd"
NODE="0.0.0.0"

IAVL_CACHE_SIZE=${IAVL_CACHE_SIZE:-1562500}
QUERY_GAS_LIMIT=${QUERY_GAS_LIMIT:-5000000}
SIMULATION_GAS_LIMIT=${SIMULATION_GAS_LIMIT:-50000000}
MEMORY_CACHE_SIZE=${MEMORY_CACHE_SIZE:-1000}

# Build genesis file incl account for each address passed in
coins="10000000000000000$DENOM"
starsd init $MONIKER --chain-id $CHAINID
echo "$KEY_MNEMONICS" | starsd keys add validator --keyring-backend $KEYRING --recover --coin-type 60
starsd genesis add-genesis-account validator $coins --keyring-backend $KEYRING

# create account for each passed in address
for addr in "$@"; do
  echo "creating genesis account: $addr"
  starsd genesis add-genesis-account $addr $coins --keyring-backend $KEYRING
done

starsd genesis gentx validator 10000000000$DENOM --chain-id $CHAINID --keyring-backend $KEYRING
starsd genesis collect-gentxs


# Set proper defaults and change ports
sed -i 's/"leveldb"/"goleveldb"/g' ~/.starsd/config/config.toml
sed -i 's#"tcp://127.0.0.1:26657"#"tcp://0.0.0.0:26657"#g' ~/.starsd/config/config.toml
sed -i "s/\"stake\"/\"$DENOM\"/g" ~/.starsd/config/genesis.json
sed -i "s/\"max_gas\": \"-1\"/\"max_gas\": \"$BLOCK_GAS_LIMIT\"/" ~/.starsd/config/genesis.json
sed -i 's/timeout_commit = "5s"/timeout_commit = "1s"/g' ~/.starsd/config/config.toml
sed -i 's/timeout_propose = "3s"/timeout_propose = "1s"/g' ~/.starsd/config/config.toml
sed -i 's/index_all_keys = false/index_all_keys = true/g' ~/.starsd/config/config.toml

sed -i "s/iavl-cache-size = 781250/iavl-cache-size = $IAVL_CACHE_SIZE/g" ~/.starsd/config/app.toml
sed -i "s/query_gas_limit = 50000000/query_gas_limit = $QUERY_GAS_LIMIT/g" ~/.starsd/config/app.toml
sed -i "s/simulation_gas_limit = 25000000/simulation_gas_limit = $SIMULATION_GAS_LIMIT/g" ~/.starsd/config/app.toml
sed -i "s/memory_cache_size = 512/memory_cache_size = $MEMORY_CACHE_SIZE/g" ~/.starsd/config/app.toml
sed -i "s/enable = false/enable = true/g" ~/.starsd/config/app.toml
sed -i "s/localhost:9090/0.0.0.0:9090/g" ~/.starsd/config/app.toml

echo "Setting Host [$NODE] on $WORKDIR/config/app.toml"
sed -i "s/localhost:/$NODE:/g" $WORKDIR/config/app.toml
sed -i "s/127.0.0.1:/$NODE:/g" $WORKDIR/config/app.toml
echo "Setting Host [$NODE] on $WORKDIR/config/client.toml"
sed -i "s/localhost:/$NODE:/g" $WORKDIR/config/client.toml
sed -i "s/127.0.0.1:/$NODE:/g" $WORKDIR/config/client.toml
echo "Setting Host [$NODE] on $WORKDIR/config/config.toml"
sed -i "s/localhost:/$NODE:/g" $WORKDIR/config/config.toml
sed -i "s/127.0.0.1:/$NODE:/g" $WORKDIR/config/config.toml

# set prunning options
echo "set prunning nothing"
sed -i 's/pruning = "default"/pruning = "nothing"/g' $WORKDIR/config/app.toml
sed -i 's/pruning-keep-recent = "0"/# pruning-keep-recent = "2"/g' $WORKDIR/config/app.toml
sed -i 's/pruning-interval = "0"/# pruning-interval = "10"/g' $WORKDIR/config/app.toml

# set swagger ui
sed -i "s/swagger = false/swagger = true/g" $WORKDIR/config/app.toml
sed -i "s/enabled-unsafe-cors = false/enabled-unsafe-cors = true/g" $WORKDIR/config/app.toml

# Start the stake
starsd start --pruning=nothing --log_level "trace"
