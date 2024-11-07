utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

SERVICE_NAME = "stargaze-local"
APP="starsd"
IMAGE_NAME = "publicawesome/stargaze:14.0.0"
STARGAZE_CONFIG_DIRPATH_ON_SERVICE = "/data"

# wallets
VALIDATOR="validator"
WALLET_1="dev01"

# Deploy contract list
CONTRACTS_LIST= [
    "cw721_base",
]

DENOM="ustars"
CHAINID="testing"
GAS_LIMIT="75000000"

def run(
    plan,
    args
):

    #####
    # StarGaze
    #####

    plan.print("Starting {} service".format(SERVICE_NAME))

    # Custom Entrypoint
    data_path = static_files.STARGAZE_CONFIG_DIRPATH+"/entry-point.sh"

    # load entry-point file as a volume file
    data = plan.upload_files(
        src=data_path,
        name="stargaze-entrypoint",
    )

    service_config=ServiceConfig(
        image=IMAGE_NAME,
        # use the new entry-point.sh
        entrypoint = ["/data/entry-point.sh"],
        ports={ 
            "rpc": PortSpec(number=26657,transport_protocol="TCP",application_protocol="http"),
            "p2p": PortSpec(number=26656,transport_protocol="TCP",application_protocol="http"),
            "rest": PortSpec(number=1317,transport_protocol="TCP",application_protocol="http"),
            "grpc": PortSpec(number=9090,transport_protocol="TCP",application_protocol="http")
        },
        public_ports={ 
            "rpc": PortSpec(number=constants.STARGAZE["public_rpc_port"], transport_protocol="TCP",application_protocol="http"),
            "p2p": PortSpec(number=constants.STARGAZE["public_p2p_port"],transport_protocol="TCP",application_protocol="http"),
            "rest": PortSpec(number=constants.STARGAZE["public_rest_port"],transport_protocol="TCP",application_protocol="http"),
            "grpc": PortSpec(number=constants.STARGAZE["public_grpc_port"],transport_protocol="TCP",application_protocol="http")
        },
        env_vars = { 
            "DENOM": DENOM,
            "CHAINID": CHAINID,
            "GAS_LIMIT": GAS_LIMIT,
            "VAL_MNEMONIC": args["VAL_MNEMONIC"],
        },
        files = {STARGAZE_CONFIG_DIRPATH_ON_SERVICE: data},
    )

    stargaze = plan.add_service(name=SERVICE_NAME,config=service_config)

    cmd="apk add curl jq unzip"
    download_cw721 = plan.exec(
        description="Installing tools dependencies",
        service_name=SERVICE_NAME,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                cmd,
            ]
        ),
    )["output"]

    # Download cw721 and hyperlane contracts
    utils.download_artifacts(plan,SERVICE_NAME,"https://github.com/public-awesome/cw-nfts/releases/download/v0.18.0/cw721_base.wasm")
    utils.download_artifacts(plan,SERVICE_NAME,"https://github.com/many-things/cw-hyperlane/releases/download/v0.0.7-rc0/cw-hyperlane-v0.0.7-rc0.zip")
    utils.decompress(plan,SERVICE_NAME,"cw-hyperlane-v0.0.7-rc0.zip")
    
    # Create development account
    utils.create_account(plan,SERVICE_NAME,APP,WALLET_1,args["DEV_MNEMONIC"])

    # Fund dev wallet
    dev_balances=utils.fund_wallet(plan,SERVICE_NAME,APP,VALIDATOR,WALLET_1,"1000000000000000","75000",DENOM)

    # Get accounts
    validator_addr = utils.get_wallet_addr(plan, SERVICE_NAME,APP,VALIDATOR)
    dev_addr = utils.get_wallet_addr(plan, SERVICE_NAME,APP,WALLET_1)
    dev_eth = utils.export_wallet(plan, SERVICE_NAME,APP,WALLET_1)

    # ---------------Deploy contracts
    contracts = utils.deploy_contracts(plan,SERVICE_NAME,APP,CONTRACTS_LIST,WALLET_1,DENOM)

    # Init NFT base contract
    # https://github.com/public-awesome/cw-nfts/blob/a5abe476c1028b2563f995adab184b86e3fc03ff/packages/cw721/src/msg.rs#L126
    cw721_init='{\"name\":\"TestNFT\",\"symbol\":\"LazyNFT\",\"minter\":\"' +"{0}".format(dev_addr)+'\"}'
    cw721_id= contracts["cw721_base"]["code_id"]
    cw721_addr=utils.instantiate(plan,SERVICE_NAME,APP,cw721_id, WALLET_1,cw721_init,'Test simple NFT')
    contracts.update({"cw721_base": { "code_id": cw721_id, "addr": cw721_addr}})
    
    return { 
        "validator_wallet" : { "address":validator_addr },
        "dev_wallet" : { "address": dev_addr, "eth_addr": dev_eth , "balance": dev_balances }, 
        "contracts": contracts,
    }