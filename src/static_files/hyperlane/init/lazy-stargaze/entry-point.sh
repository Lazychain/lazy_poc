CHAINID=${CHAINID:-stargaze}

cd /app
cp /root/config.yaml .
# rm -rf /app/artifacts/hpl_mailbox.wasm && cp /app/mailbox/hpl_mailbox.wasm /app/artifacts
# rm -rf /app/artifacts/hpl_hook_aggregate.wasm && cp /app/aggregate/hpl_hook_aggregate.wasm /app/artifacts
rm -rf /app/artifacts/hpl_igp.wasm && cp /app/igp/hpl_igp.wasm /app/artifacts

hyperlane core deploy --chain lazy --yes

echo y | yarn cw-hpl upload local -n $CHAINID
yarn cw-hpl deploy local -n $CHAINID

# Parse stargaze contracts address
jq '.chains.stargaze = {mailbox: .chains.stargaze.mailbox, validatorAnnounce: .chains.stargaze.validatorAnnounce, interchainGasPaymaster: .chains.stargaze.interchainGasPaymaster, merkleTreeHook: .chains.stargaze.merkleTreeHook}' ./context/$CHAINID.config.json > stargaze.json
jq '.deployments = {mailbox_cosmos: .deployments.core.mailbox.address, validator_announce_cosmos: .deployments.core.validator_announce.address} | .deployments' ./context/$CHAINID.json | jq '{chains: {stargaze: .}}'  > stargaze_extra.json

jq -r '.deployments.core | {mailbox: .mailbox.address, validator_announce: .validator_announce.address}' context/stargaze.json > part0.json
jq -r '.deployments.isms | {hpl_ism_multisig: .address}' context/stargaze.json > part1.json
jq -r '.deployments.hooks.default | select(.type == "hpl_hook_aggregate") | { "hpl_hook_aggregate": .address }' context/stargaze.json > part2.json
jq -r '.deployments.hooks.default.hooks[] | select(.type != "hpl_hook_aggregate") | {(.type): .address}' context/stargaze.json > part3.json
jq -r '.deployments.hooks.default.hooks[] | select(.type == "hpl_igp") | {"hpl_igp_oracle": .oracle.address}' context/stargaze.json > part4.json
jq -r '.deployments.hooks.required | { "hpl_hook_fee": .address }' context/stargaze.json > part5.json
cat part0.json part1.json part2.json part3.json part4.json part5.json | jq -s 'reduce .[] as $obj ({chains: {stargaze_xt: {}}}; .chains.stargaze_xt += $obj)' > stargaze_extra2.json

# Parse lazy contract address
yq eval -o=json . /root/.hyperlane/chains/lazy/addresses.yaml | jq '{chains: {lazy: .}}' > lazy.json

# Join json Maps
jq -s '.[0] * .[1] * .[2]' stargaze.json stargaze_extra2.json lazy.json > chains.json

cat chains.json