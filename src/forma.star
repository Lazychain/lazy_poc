"""Froma blockchain"""

utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

SERVICE_NAME = "forma-local"
APP = "geth"
IMAGE_NAME = "ethereum/client-go:v1.13.10"  # "ghcr.io/forma-dev/forma-geth"

# wallets, defined in genesis.json
VALIDATOR = "0xaC21B97d35Bf75A7dAb16f35b111a50e78A72F30"
WALLET_1 = "0x4F10c018114F3d214f7CD1dEe06Bb06F54A076A0"

# Deploy contract list
CONTRACTS_LIST = []

DENOM = "utia"
CHAINID = "testing"
GAS_LIMIT = "75000000"

def run(plan, args = {}):
    #####
    # FORMA
    #####

    plan.print("Starting {} service".format(SERVICE_NAME))

    entrypoint = plan.upload_files(
        src = static_files.FORMA_CONFIG_DIRPATH + "/entry-point.sh",
        name = "forma_entrypoint",
    )

    genesis = plan.upload_files(
        src = static_files.FORMA_CONFIG_DIRPATH + "/genesis.json",
        name = "forma_genesis",
    )

    # dev_wallet_kf = plan.upload_files(
    #     src=static_files.FORMA_CONFIG_DIRPATH+"/UTC--2024-11-13T15-02-57.949Z--0x468402289EbA56fC07aBf413aBF9f0a6Da4Ea15D",
    #     name="forma_dev_wallet_keyfile",
    # )

    service_config = ServiceConfig(
        # Using rollkit version v0.13.5
        image = IMAGE_NAME,
        # use the new entry-point.sh
        entrypoint = ["/root/run/entry-point.sh"],
        ports = {
            # "grpc": PortSpec(number=50051,transport_protocol="TCP",application_protocol="http"),
            "json-rpc": PortSpec(number = 8545, transport_protocol = "TCP", application_protocol = "http"),
            # "ws": PortSpec(number=8546,transport_protocol="TCP",application_protocol="ws"),
        },
        public_ports = {
            # "grpc": PortSpec(number=constants.FORMA["public_grpc_port"],transport_protocol="TCP",application_protocol="http"),
            "json-rpc": PortSpec(number = constants.FORMA["public_json_rpc_port"], transport_protocol = "TCP", application_protocol = "http"),
            # "ws": PortSpec(number=constants.FORMA["public_ws_port"],transport_protocol="TCP",application_protocol="ws"),
        },
        env_vars = {
            "DENOM": DENOM,
            "CHAINID": CHAINID,
            "GAS_LIMIT": GAS_LIMIT,
        },
        files = {
            "/root/run": entrypoint,
            "/root/init": genesis,
            # "/root/.ethereum/keystore": dev_wallet_kf,
        },
        user = User(uid = 0, gid = 0),

        # cmd=[
        #     "/bin/sh",
        #     "-c",
        #     "sleep infinity"
        # ],
    )

    plan.add_service(name = SERVICE_NAME, config = service_config)

    contracts = {}
    return {
        "validator_wallet": {"address": VALIDATOR},
        "dev_wallet": {"address": WALLET_1},
        "contracts": contracts,
    }
