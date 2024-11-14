"""Lazy Chain infrastructure spammer"""
constants = import_module("./src/constants.star")
utils = import_module("./src/utils.star")
stargaze = import_module("./src/stargaze.star")
celestia = import_module("./src/celestia.star")

hyp_stargaze = import_module("./src/hyperlane/stargaze.star")
hyp_forma = import_module("./src/hyperlane/forma.star")

blockscout = import_module("./src/blockscout.star")
lazy_node = import_module("./src/lazy.star")
forma = import_module("./src/forma.star")

# Note: by default port jsonrpc 7980
# https://github.com/rollkit/local-da/blob/main/main.star#L4C28-L4C32
da_node = import_module("github.com/rollkit/local-da/main.star@v0.3.0")

def run(plan, args):
    """Runs  Infrastructure.

     Args:
        plan: plan
        args: validator and dev wallet mnemonics
    """
    # plan.print("Starting with the following configuration: " + args["MNEMONIC"])

    # response = celestia.run(plan,dev_mnemonic)
    # celestia_validator_addr=response["validator_addr"]
    # celestia_dev_addr=response["dev_addr"]

    da_address = da_node.run(plan)
    plan.print("connecting to da layer via {0}".format(da_address))

    # Lazy chain
    response = lazy_node.run(plan, da_address, args)
    lazy_validator_wallet = response["validator_wallet"]
    lazy_dev_wallet = response["dev_wallet"]
    lazy_contracts = response["contracts"]

    # Forma chain
    response = forma.run(plan, args)
    forma_validator_wallet = response["validator_wallet"]
    forma_dev_wallet = response["dev_wallet"]
    forma_contracts = response["contracts"]

    # stargaze
    response = stargaze.run(plan, args)
    stargaze_validator_wallet = response["validator_wallet"]
    stargaze_dev_wallet = response["dev_wallet"]
    stargaze_contracts = response["contracts"]

    # Hyperlane Stargaze-Lazy
    config_lazy_stargaze = hyp_stargaze.init(plan, args)
    stargaze.fix_hyperlane_validator_init(plan, config_lazy_stargaze)
    hyp_stargaze.run(plan, config_lazy_stargaze)

    # Hyperlane Stargaze-Lazy
    config_lazy_forma = hyp_forma.init(plan, args)
    hyp_forma.run(plan, config_lazy_forma)

    # BlockScout
    # response = blockscout.run( plan)
    # plan.print(response)

    response = {
        "lazy": {
            "rpc": "http://127.0.0.1:{0}".format(constants.LAZY["public_rpc_port"]),
            "rest": "http://127.0.0.1:{0}".format(constants.LAZY["public_rest_port"]),
            "json-rpc": "http://127.0.0.1:{0}".format(constants.LAZY["public_json_rpc_port"]),
            "grpc": "http://127.0.0.1:{0}".format(constants.LAZY["public_grpc_port"]),
            "validator_wallet": lazy_validator_wallet,
            "dev_wallet": lazy_dev_wallet,
            "contracts": lazy_contracts,
        },
        "forma": {
            "ws": "http://127.0.0.1:{0}".format(constants.FORMA["public_ws_port"]),
            "json-rpc": "http://127.0.0.1:{0}".format(constants.FORMA["public_json_rpc_port"]),
            "grpc": "http://127.0.0.1:{0}".format(constants.FORMA["public_grpc_port"]),
            "validator_wallet": forma_validator_wallet,
            "dev_wallet": forma_dev_wallet,
            "contracts": forma_contracts,
        },
        "stargaze": {
            "rpc": "http://127.0.0.1:{0}".format(constants.STARGAZE["public_rpc_port"]),
            "rest": "http://127.0.0.1:{0}".format(constants.STARGAZE["public_rest_port"]),
            "grpc": "http://127.0.0.1:{0}".format(constants.STARGAZE["public_grpc_port"]),
            "validator_wallet": stargaze_validator_wallet,
            "dev_wallet": stargaze_dev_wallet,
            "contracts": stargaze_contracts,
        },
        "hyperlane": {
            "lazy-stargaze": {
                "relayer": {
                    "grpc": "http://127.0.0.1:{0}".format(constants.HYPERLANE["lazy-stargaze"]["relayer"]["public_grpc_port"]),
                },
                "lazy": {
                    "grpc": "http://127.0.0.1:{0}".format(constants.HYPERLANE["lazy-stargaze"]["lazy"]["public_grpc_port"]),
                },
                "stargaze": {
                    "grpc": "http://127.0.0.1:{0}".format(constants.HYPERLANE["lazy-stargaze"]["stargaze"]["public_grpc_port"]),
                },
                "config": config_lazy_stargaze,
            },
            "lazy-forma": {
                "relayer": {
                    "grpc": "http://127.0.0.1:{0}".format(constants.HYPERLANE["lazy-forma"]["relayer"]["public_grpc_port"]),
                },
                "lazy": {
                    "grpc": "http://127.0.0.1:{0}".format(constants.HYPERLANE["lazy-forma"]["lazy"]["public_grpc_port"]),
                },
                "forma": {
                    "grpc": "http://127.0.0.1:{0}".format(constants.HYPERLANE["lazy-forma"]["forma"]["public_grpc_port"]),
                },
                "config": config_lazy_forma,
            },
        },
        "blockscout": {
            "explorer": "http://127.0.0.1:{0}".format(constants.BLOCKSCOUT["proxy"]["ports"]["8080"].number),
        },
    }

    return response
