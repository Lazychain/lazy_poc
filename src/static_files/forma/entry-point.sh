mkdir -p ./geth-data
geth --datadir ./geth-data --db.engine pebble --state.scheme=hash init /root/init/genesis.json
touch ./password.txt
geth \
      --datadir ./geth-data \
      --db.engine=pebble \
      --networkid=1337 \
      --http.corsdomain=* \
      --http.vhosts=* \
      --http.api=eth,net,web3,debug,txpool \
      --gcmode=archive \
      --state.scheme=hash \
      --history.transactions=0 \
      --history.state=0 \
      --http \
      --http.addr=0.0.0.0 \
      --http.port=8545 \
      --dev \
      --password password.txt

      # --ws \
      # --ws.addr=0.0.0.0 \
      # --ws.port=8546 \
      # --ws.origins=* \
      # --grpc \
      # --grpc.addr=0.0.0.0 \
      # --grpc.port=50051 \
