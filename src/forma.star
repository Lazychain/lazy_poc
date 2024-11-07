# Forma Kurtosis

## Astria - add bash and jq to support start-geth.sh in conductor
# RUN apk add bash jq
# Astria - copy genesis.json so it can be used in start-geth.sh
# COPY genesis.json /genesis.json

utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

SERVICE_NAME = "forma-local"
APP="geth"
IMAGE_NAME = "ghcr.io/forma-dev/forma-geth"
FORMA_CONFIG_DIRPATH_ON_SERVICE = "/root"

# wallets
VALIDATOR="validator"
WALLET_1="dev01"

# Deploy contract list
CONTRACTS_LIST= []

DENOM="utia"
CHAINID="testing"
GAS_LIMIT="75000000"

def run(
    plan,
    da_address,
    mnemonic
):

    #####
    # LAZY
    #####

    plan.print("Starting {} service".format(SERVICE_NAME))

    # Custom Entrypoint
    data_path = static_files.LAZY_CONFIG_DIRPATH+"/entry-point.sh"

    # load entry-point file as a volume file
    data = plan.upload_files(
        src=data_path,
        name="lazy-entrypoint",
    )

    service_config=ServiceConfig(
        # Using rollkit version v0.13.5
        image=IMAGE_NAME,
        ports={ 
            "rpc": PortSpec(number=26657,transport_protocol="TCP",application_protocol="http"),
            "rest": PortSpec(number=1317,transport_protocol="TCP",application_protocol="http"),
            "json-rpc": PortSpec(number=8545,transport_protocol="TCP",application_protocol="http"),
            "grpc": PortSpec(number=9090,transport_protocol="TCP",application_protocol="http")
            },
        public_ports={ 
            "rpc": PortSpec(number=constants.LAZY["public_rpc_port"], transport_protocol="TCP",application_protocol="http"),
            "rest": PortSpec(number=constants.LAZY["public_rest_port"],transport_protocol="TCP",application_protocol="http"),
            "json-rpc": PortSpec(number=constants.LAZY["public_json_rpc_port"],transport_protocol="TCP",application_protocol="http"),
            "grpc": PortSpec(number=constants.LAZY["public_grpc_port"],transport_protocol="TCP",application_protocol="http")
            },
        env_vars = { 
            "DA_ADDRESS": da_address,
            "DENOM": DENOM,
            "CHAINID": CHAINID,
            "GAS_LIMIT": GAS_LIMIT,
             },
        files = {LAZY_CONFIG_DIRPATH_ON_SERVICE: data},
    )

    lazy = plan.add_service(name=SERVICE_NAME,config=service_config)

    # Create development account
    utils.create_account(plan,SERVICE_NAME,APP,WALLET_1,mnemonic)

    # Fund dev wallet
    dev_balances=utils.fund_wallet(plan,SERVICE_NAME,APP,VALIDATOR,WALLET_1,"100000000000000000000","4000000000000000",DENOM)

    # Get accounts
    validator_addr = utils.get_wallet_addr(plan, SERVICE_NAME,APP,VALIDATOR)
    dev_addr = utils.get_wallet_addr(plan, SERVICE_NAME,APP,WALLET_1)

    contracts = {}
    return { 
        "validator_wallet" : { "address":validator_addr }, 
        "dev_wallet" : { "address": dev_addr },
        "contracts": contracts, 
    }
    
