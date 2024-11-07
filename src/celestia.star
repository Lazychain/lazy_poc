# This Kurtosis package spins up a local Celestia based on rollkit 
# https://github.com/rollkit/local-celestia-devnet

utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")


SERVICE_NAME = "celestia-local"
APP="celestia-appd"
IMAGE_NAME = "ghcr.io/rollkit/local-celestia-devnet:v0.13.1"
CELESTIA_CONFIG_DIRPATH_ON_SERVICE = "/data"

# wallets
VALIDATOR="validator"
WALLET_1="dev01"

# Deploy contract list
CONTRACTS_LIST= []

ENV_VARS = {}
ENV_VARS["CELESTIA_NAMESPACE"] = "lazy_namespace"


DENOM="utia"
CHAINID="testing"
GAS_LIMIT="75000000"

def run(
    plan,
    args={}
):

    plan.print("Starting {} service".format(SERVICE_NAME))

    service_config = ServiceConfig(
        image=IMAGE_NAME,
        env_vars=ENV_VARS,
        ports={ 
            "validator-grpc": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
            "validator-rpc": PortSpec(number=26657,transport_protocol="TCP", application_protocol="http"),
            "bridge-rpc": PortSpec(number=26658, transport_protocol="TCP", application_protocol="http"),
            "bridge-rest": PortSpec(number=26659, transport_protocol="TCP", application_protocol="http")
        },
        public_ports={ 
            "validator-grpc": PortSpec(number=constants.CELESTIA["validator_grpc_port"], transport_protocol="TCP", application_protocol="http"),
            "validator-rpc": PortSpec(number=constants.CELESTIA["validator_rpc_port"],transport_protocol="TCP", application_protocol="http"),
            "bridge-rpc": PortSpec(number=constants.CELESTIA["bridge_rpc_port"], transport_protocol="TCP", application_protocol="http"),
            "bridge-rest": PortSpec(number=constants.CELESTIA["bridge_rest_port"], transport_protocol="TCP", application_protocol="http")
        },
    )

    local_da = plan.add_service(name=SERVICE_NAME,config=service_config)

    # Create development account
    utils.create_account(plan,SERVICE_NAME,APP,WALLET_1,args["MNEMONIC"])

    # Hyperlane needs this, i feel a little unsecure here...
    dev_pkey = utils.get_wallet_pubkey(plan, SERVICE_NAME,APP,WALLET_1)
    export_wallet = utils.export_wallet(plan, SERVICE_NAME,APP,WALLET_1)

    # Fund dev wallet
    dev_balances=utils.fund_wallet(plan,SERVICE_NAME,APP,VALIDATOR,WALLET_1,"1000000","500",DENOM)

    # Get accounts
    validator_addr = utils.get_wallet_addr(plan, SERVICE_NAME,APP,VALIDATOR)
    dev_addr = utils.get_wallet_addr(plan, SERVICE_NAME,APP,WALLET_1)


    contracts = {}

    return { 
        "validator_wallet" : { "address":validator_addr, "exp": export_wallet }, 
        "dev_wallet" : { "address": dev_addr, "pkey": dev_pkey },
        "contracts": contracts, 
    }
    
