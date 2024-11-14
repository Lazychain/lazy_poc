utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

SERVICE_NAME = "hyperlane-local"
AGENT_IMAGE_NAME = "gcr.io/abacus-labs-dev/hyperlane-agent:main"
INIT_IMAGE_NAME = "ghcr.io/lazychain/cw-hyperlane-init:v0.0.1-beta1"


def init_lazy_stargaze(
    plan,
    args={}
):
    service = SERVICE_NAME+"-init-lazy-stargaze"
    plan.print("Starting {} service".format(service))
    ENV_VARS = {}
    ENV_VARS["HYP_KEY"] = args["DEV_MNEMONIC"]

    lazy_chain_cfg = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-stargaze/lazy/metadata.yaml",
        name="init_metadata",
    )

    core_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-stargaze/core-config.yaml",
        name="init_core_config_lazy_stargaze",
    )

    cw_config_file=lazy_stargaze_render_cw_config(plan,args["DEV_MNEMONIC"])

    entry_point = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-stargaze/entry-point.sh",
        name="hyperlane_init_entrypoint",
    )


    init_service_config = ServiceConfig(
        image=INIT_IMAGE_NAME,
        env_vars=ENV_VARS,
        # entrypoint = [],
        files = {
            "/root/": cw_config_file,
            "/root/.hyperlane/chains/lazy/": lazy_chain_cfg,
            "/app/configs/": core_config,
            "/app/run/": entry_point,
            },
        
        cmd=["/bin/sh","-c","sleep infinity"],
    )

    init_service = plan.add_service(name=service,config=init_service_config)

    recipe_result = plan.wait(
        service_name=service,
        recipe=ExecRecipe(command = ["sh", "-c", "/app/run/entry-point.sh"]),
        field="code",
        assertion="==",
        target_value=0,
        timeout="5m",
        description = "Deploying and Configure Lazy (ETH) and Cosmos (Stargaze) Hyperlane contracts"
    )

    # plan.print("Response[{0}]".format(recipe_result["code"]))

    return {
        "chains": {
                "stargaze": get_cosmos_address(plan,service,"stargaze"),
                "lazy": get_eth_address(plan,service,"lazy"),
        }
    }

def init_lazy_forma(
    plan,
    args={}
):

    service = SERVICE_NAME+"-init-lazy-forma"
    plan.print("Starting {} service".format(service))
    ENV_VARS = {}
    ENV_VARS["HYP_KEY"] = args["DEV_MNEMONIC"]

    lazy_chain_cfg = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-forma/lazy/metadata.yaml",
        name="init_metadata_lazy",
    )

    forma_chain_cfg = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-forma/forma/metadata.yaml",
        name="init_metadata_forma",
    )

    core_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-forma/core-config.yaml",
        name="init_core_config_lazy_forma",
    )

    entry_point = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-forma/entry-point.sh",
        name="hyperlane_init_entrypoint_lazy_forma",
    )


    init_service_config = ServiceConfig(
        image=INIT_IMAGE_NAME,
        env_vars=ENV_VARS,
        # entrypoint = [],
        files = {
            "/root/.hyperlane/chains/lazy/": lazy_chain_cfg,
            "/root/.hyperlane/chains/forma/": forma_chain_cfg,
            "/app/configs/": core_config,
            "/app/run/": entry_point,
            },
        
        cmd=["/bin/sh","-c","sleep infinity"],
    )

    init_service = plan.add_service(name=service,config=init_service_config)

    # recipe_result = plan.wait(
    #     service_name=service,
    #     recipe=ExecRecipe(command = ["sh", "-c", "/app/run/entry-point.sh"]),
    #     field="code",
    #     assertion="==",
    #     target_value=0,
    #     timeout="5m",
    #     description = "Deploying and Configure Lazy (ETH) and Forma (ETH) Hyperlane contracts"
    # )

    # return {
    #     "chains": {
    #             "forma": get_eth_address(plan,service,"forma"),
    #             "lazy": get_eth_address(plan,service,"lazy"),
    #     }
    # }

def run_lazy_stargaze(
    plan,
    args={}
):

    service= SERVICE_NAME+"lazy-stargaze"
    agent_config=render_agent_config(plan,args, "lazy-stargaze")


    relayer_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/config/lazy-stargaze/relayer.json",
        name="relayer_config",
    )

    relayer_service_config = ServiceConfig(
        image=AGENT_IMAGE_NAME,
        env_vars={"CONFIG_FILES" : "/etc/hyperlane/relayer.json" },
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["lazy-stargaze"]["relayer"]["public_grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": relayer_config,
            },
        cmd=[
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/stargaze && ./relayer", # sleep infinity
        ],
        user = User(uid=0, gid=0),
    )

    relayer = plan.add_service(name=service+"-relayer",config=relayer_service_config)

    lazy_validator_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/config/lazy-stargaze/validator.lazy.json",
        name="lazy_validator_config",
    )
    lazy_validator_service_config = ServiceConfig(
        image=AGENT_IMAGE_NAME,
        env_vars={"CONFIG_FILES" : "/etc/hyperlane/validator.lazy.json" },
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["lazy-stargaze"]["lazy_validator"]["public_grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": lazy_validator_config,
            },
        cmd=[
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/stargaze && ./validator", # sleep infinity
        ],
        user = User(uid=0, gid=0),
    )

    lazy_validator = plan.add_service(name=service+"-lazy-validator",config=lazy_validator_service_config)

    stargaze_validator_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/config/lazy-stargaze/validator.stargaze.json",
        name="stargaze_validator_config",
    )
    stargaze_validator_service_config = ServiceConfig(
        image=AGENT_IMAGE_NAME,
        env_vars={"CONFIG_FILES" : "/etc/hyperlane/validator.stargaze.json" },
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["lazy-stargaze"]["stargaze_validator"]["public_grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": stargaze_validator_config,
            },
        cmd=[
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/stargaze && ./validator",
        ],
        user = User(uid=0, gid=0),
    )

    stagraze_validator = plan.add_service(name=service+"-stargaze-validator",config=stargaze_validator_service_config)

def run_lazy_forma(
    plan,
    args={}
):

    service= SERVICE_NAME+"lazy-forma"
    agent_config=render_agent_config(plan,args,"lazy-forma")


    relayer_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/config/lazy-stargaze/relayer.json",
        name="relayer_config",
    )

    relayer_service_config = ServiceConfig(
        image=AGENT_IMAGE_NAME,
        env_vars={"CONFIG_FILES" : "/etc/hyperlane/relayer.json" },
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["lazy-stargaze"]["relayer"]["public_grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": relayer_config,
            },
        cmd=[
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/stargaze && ./relayer", # sleep infinity
        ],
        user = User(uid=0, gid=0),
    )

    relayer = plan.add_service(name=service+"-relayer",config=relayer_service_config)

    lazy_validator_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/config/lazy-stargaze/validator.lazy.json",
        name="lazy_validator_config",
    )
    lazy_validator_service_config = ServiceConfig(
        image=AGENT_IMAGE_NAME,
        env_vars={"CONFIG_FILES" : "/etc/hyperlane/validator.lazy.json" },
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["lazy-stargaze"]["lazy_validator"]["public_grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": lazy_validator_config,
            },
        cmd=[
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/stargaze && ./validator", # sleep infinity
        ],
        user = User(uid=0, gid=0),
    )

    lazy_validator = plan.add_service(name=service+"-lazy-validator",config=lazy_validator_service_config)

    stargaze_validator_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/config/lazy-stargaze/validator.stargaze.json",
        name="stargaze_validator_config",
    )
    stargaze_validator_service_config = ServiceConfig(
        image=AGENT_IMAGE_NAME,
        env_vars={"CONFIG_FILES" : "/etc/hyperlane/validator.stargaze.json" },
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["lazy-stargaze"]["stargaze_validator"]["public_grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": stargaze_validator_config,
            },
        cmd=[
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/stargaze && ./validator",
        ],
        user = User(uid=0, gid=0),
    )

    stagraze_validator = plan.add_service(name=service+"-stargaze-validator",config=stargaze_validator_service_config)

def lazy_stargaze_render_cw_config(plan, mnemonic):
    config_file_template = read_file(static_files.HYPERLANE_CONFIG_DIRPATH+"/init/lazy-stargaze/stargaze/config.yaml.tmpl")
    cw_config_file = plan.render_templates(
        name="cw-configuration",
        config={
            "config.yaml": struct(
                template=config_file_template,
                data={
                    "MNEMONIC": mnemonic,
                }
            )
        }
    )
    return cw_config_file

def render_agent_config(plan, data, path):

    plan.print("Using {0}".format(data))
    config_file_template = read_file(static_files.HYPERLANE_CONFIG_DIRPATH+"/config/{0}/agent-config.json.tmpl".format(path))
    agent_config_file = plan.render_templates(
        name="agent-configuration",
        config={
            "agent-config.json": struct(
                template=config_file_template,
                data=data
            )
        }
    )
    return agent_config_file

def get_cosmos_address(plan,service, chain):
    response = plan.exec(
         service_name=service,
         recipe=ExecRecipe(
            command=["/bin/sh", "-c", "cat chains.json"],
            extract={
               "interchainGasPaymaster":"fromjson | .chains.{0}.interchainGasPaymaster".format(chain),
               "merkleTreeHook":"fromjson | .chains.{0}.merkleTreeHook".format(chain),
               "mailbox_cosmos":"fromjson | .chains.{0}.mailbox_cosmos".format(chain),
               "validator_announce_cosmos":"fromjson | .chains.{0}.validator_announce_cosmos".format(chain),
               "mailbox":"fromjson | .chains.{0}.mailbox".format(chain),
               "validatorAnnounce":"fromjson | .chains.{0}.validatorAnnounce".format(chain),
            }
        ),
    )
    return {
        "interchainGasPaymaster": response["extract.interchainGasPaymaster"],
        "merkleTreeHook": response["extract.merkleTreeHook"],
        "mailbox_cosmos": response["extract.mailbox_cosmos"],
        "validator_announce_cosmos": response["extract.validator_announce_cosmos"],
        "mailbox": response["extract.mailbox"],
        "validatorAnnounce": response["extract.validatorAnnounce"],
    }

def get_eth_address(plan,service, chain):

    response = plan.exec(
         service_name=service,
         recipe=ExecRecipe(
            command=["/bin/sh", "-c", "cat chains.json"],
            extract={
               "domainRoutingIsmFactory":"fromjson | .chains.{0}.domainRoutingIsmFactory".format(chain),
               "interchainAccountIsm":"fromjson | .chains.{0}.interchainAccountIsm".format(chain),
               "interchainAccountRouter":"fromjson | .chains.{0}.interchainAccountRouter".format(chain),
               "mailbox":"fromjson | .chains.{0}.mailbox".format(chain),
               "merkleTreeHook":"fromjson | .chains.{0}.merkleTreeHook".format(chain),
               "proxyAdmin":"fromjson | .chains.{0}.proxyAdmin".format(chain),
               "staticAggregationHookFactory":"fromjson | .chains.{0}.staticAggregationHookFactory".format(chain),
               "staticAggregationIsmFactory":"fromjson | .chains.{0}.staticAggregationIsmFactory".format(chain),
               "staticMerkleRootMultisigIsmFactory":"fromjson | .chains.{0}.staticMerkleRootMultisigIsmFactory".format(chain),
               "staticMerkleRootWeightedMultisigIsmFactory":"fromjson | .chains.{0}.staticMerkleRootWeightedMultisigIsmFactory".format(chain),
               "staticMessageIdMultisigIsmFactory":"fromjson | .chains.{0}.staticMessageIdMultisigIsmFactory".format(chain),
               "staticMessageIdWeightedMultisigIsmFactory":"fromjson | .chains.{0}.staticMessageIdWeightedMultisigIsmFactory".format(chain),
               "testRecipient":"fromjson | .chains.{0}.testRecipient".format(chain),
               "validatorAnnounce":"fromjson | .chains.{0}.validatorAnnounce".format(chain),
            }
        ),
    )
    return {
        "domainRoutingIsmFactory": response["extract.domainRoutingIsmFactory"],
        "interchainAccountIsm": response["extract.interchainAccountIsm"],
        "interchainAccountRouter": response["extract.interchainAccountRouter"],
        "mailbox": response["extract.mailbox"],
        "merkleTreeHook": response["extract.merkleTreeHook"],
        "proxyAdmin": response["extract.proxyAdmin"],
        "staticAggregationHookFactory": response["extract.staticAggregationHookFactory"],
        "staticAggregationIsmFactory": response["extract.staticAggregationIsmFactory"],
        "staticMerkleRootMultisigIsmFactory": response["extract.staticMerkleRootMultisigIsmFactory"],
        "staticMerkleRootWeightedMultisigIsmFactory": response["extract.staticMerkleRootWeightedMultisigIsmFactory"],
        "staticMessageIdMultisigIsmFactory": response["extract.staticMessageIdMultisigIsmFactory"],
        "staticMessageIdWeightedMultisigIsmFactory": response["extract.staticMessageIdWeightedMultisigIsmFactory"],
        "testRecipient": response["extract.testRecipient"],
        "validatorAnnounce": response["extract.validatorAnnounce"],
    }