CHAINID=${CHAINID:-stargaze}

cd /app
cp /root/config.yaml .

hyperlane core deploy --chain lazy --yes

echo y | yarn cw-hpl upload local -n $CHAINID
yarn cw-hpl deploy local -n $CHAINID

# Parse stargaze contracts address
jq '.chains.stargaze = {mailbox: .chains.stargaze.mailbox, validatorAnnounce: .chains.stargaze.validatorAnnounce, interchainGasPaymaster: .chains.stargaze.interchainGasPaymaster, merkleTreeHook: .chains.stargaze.merkleTreeHook}' ./context/$CHAINID.config.json > stargaze.json
jq '.deployments = {mailbox_cosmos: .deployments.core.mailbox.address, validator_announce_cosmos: .deployments.core.validator_announce.address} | .deployments' ./context/$CHAINID.json | jq '{chains: {stargaze: .}}'  > stargaze_extra.json

# Parse lazy contract address
yq eval -o=json . /root/.hyperlane/chains/lazy/addresses.yaml | jq '{chains: {lazy: .}}' > lazy.json

# Join 2 json Maps
jq -s '.[0] * .[1] * .[2]' stargaze.json stargaze_extra.json lazy.json > chains.json

cat chains.json