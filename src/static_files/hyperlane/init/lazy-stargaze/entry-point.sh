CHAINID=${CHAINID:-stargaze}

cd /app
cp /root/config.yaml .

hyperlane core deploy --chain lazy --yes

echo y | yarn cw-hpl upload local -n $CHAINID
yarn cw-hpl deploy local -n $CHAINID

# Parse stargaze contracts address
jq '.chains.stargaze = {mailbox: .chains.stargaze.mailbox, validatorAnnounce: .chains.stargaze.validatorAnnounce, interchainGasPaymaster: .chains.stargaze.interchainGasPaymaster, merkleTreeHook: .chains.stargaze.merkleTreeHook}' ./context/$CHAINID.config.json > stargaze.json
jq '.deployments = {mailbox_cosmos: .deployments.core.mailbox.address, validator_announce_cosmos: .deployments.core.validator_announce.address} | .deployments' ./context/$CHAINID.json | jq '{chains: {stargaze: .}}'  > stargaze_extra.json

jq -r '.deployments.core | {mailbox: .mailbox.address, validator_announce: .validator_announce.address}' context/stargaze.json > part1.json
jq -r '.deployments.isms | {hpl_ism_multisig: .address}' context/stargaze.json >> part1.json
jq -r '.deployments.hooks.default | {hpl_hook_aggregate: .address, hooks: [.hooks[] | {(.type): .address}]}' context/stargaze.json > part2.json
jq -r '.deployments.hooks.required | {hpl_hook_fee: .address}' context/stargaze.json > part3.json
cat part1.json part2.json part3.json | jq -s 'reduce .[] as $obj ({chains: {stargaze_xt: {}}}; .chains.stargaze_xt += $obj)' > stargaze_extra2.json

# Parse lazy contract address
yq eval -o=json . /root/.hyperlane/chains/lazy/addresses.yaml | jq '{chains: {lazy: .}}' > lazy.json

# Join json Maps
jq -s '.[0] * .[1] * .[2] * .[3]' stargaze.json stargaze_extra.json stargaze_extra2.json lazy.json > chains.json

cat chains.json