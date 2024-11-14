cd /app

hyperlane core deploy --chain forma --yes
hyperlane core deploy --chain lazy --yes

# Parse forma contract address
yq eval -o=json . /root/.hyperlane/chains/forma/addresses.yaml | jq '{chains: {forma: .}}' > forma.json
yq eval -o=json . /root/.hyperlane/chains/lazy/addresses.yaml | jq '{chains: {lazy: .}}' > lazy.json

# Join 2 json Maps
jq -s '.[0] * .[1]' forma.json forma.json > chains.json

cat chains.json
