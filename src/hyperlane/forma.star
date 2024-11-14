utils = import_module("../utils.star")
static_files = import_module("../static_files/static_files.star")
constants = import_module("../constants.star")
hyperlane = import_module("../hyperlane.star")

CHAIN_A = "lazy"
CHAIN_B = "forma"
MODULE = CHAIN_A + "-" + CHAIN_B
CONFIG_PATH = "../" + static_files.HYPERLANE_CONFIG_DIRPATH + "/config/" + MODULE
INIT_PATH = "../" + static_files.HYPERLANE_CONFIG_DIRPATH + "/init/" + MODULE
SERVICE_NAME = "hyperlane-local-" + MODULE
AGENT_IMAGE_NAME = "gcr.io/abacus-labs-dev/hyperlane-agent:main"
INIT_IMAGE_NAME = "ghcr.io/lazychain/cw-hyperlane-init:v0.0.1-beta1"

def init(plan, args = {}):
    service = SERVICE_NAME + "-init"
    plan.print("Starting {} service".format(service))
    ENV_VARS = {}
    ENV_VARS["HYP_KEY"] = args["DEV_MNEMONIC"]

    lazy_chain_cfg = plan.upload_files(
        src = "{0}/lazy/metadata.yaml".format(INIT_PATH),
        name = "init_metadata_lazy",
    )

    forma_chain_cfg = plan.upload_files(
        src = "{0}/forma/metadata.yaml".format(INIT_PATH),
        name = "init_metadata_forma",
    )

    core_config = plan.upload_files(
        src = "{0}/core-config.yaml".format(INIT_PATH),
        name = "init_core_config_lazy_forma",
    )

    entry_point = plan.upload_files(
        src = "{0}/entry-point.sh".format(INIT_PATH),
        name = "hyperlane_init_entrypoint_lazy_forma",
    )

    init_service_config = ServiceConfig(
        image = INIT_IMAGE_NAME,
        env_vars = ENV_VARS,
        # entrypoint = [],
        files = {
            "/root/.hyperlane/chains/lazy/": lazy_chain_cfg,
            "/root/.hyperlane/chains/forma/": forma_chain_cfg,
            "/app/configs/": core_config,
            "/app/run/": entry_point,
        },
        cmd = ["/bin/sh", "-c", "sleep infinity"],
    )

    plan.add_service(name = service, config = init_service_config)

    plan.wait(
        service_name = service,
        recipe = ExecRecipe(command = ["sh", "-c", "/app/run/entry-point.sh"]),
        field = "code",
        assertion = "==",
        target_value = 0,
        timeout = "5m",
        description = "Deploying and Configure Lazy (ETH) and Forma (ETH) Hyperlane contracts",
    )

    return {
        "chains": {
            CHAIN_A: hyperlane.get_eth_address(plan, service, CHAIN_A),
            CHAIN_B: hyperlane.get_eth_address(plan, service, CHAIN_B),
        },
    }

def run(plan, args = {}):
    service = SERVICE_NAME + "-run"
    agent_config = render_agent_config(plan, args)

    relayer_config = plan.upload_files(
        src = "{0}/relayer.json".format(CONFIG_PATH),
        name = "lazy_forma_relayer_config",
    )

    relayer_service_config = ServiceConfig(
        image = AGENT_IMAGE_NAME,
        env_vars = {"CONFIG_FILES": "/etc/hyperlane/relayer.json"},
        ports = {
            "grpc-port": PortSpec(number = 9090, transport_protocol = "TCP", application_protocol = "http"),
        },
        public_ports = {
            "grpc-port": PortSpec(number = constants.HYPERLANE[MODULE]["relayer"]["public_grpc_port"], transport_protocol = "TCP", application_protocol = "http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": relayer_config,
        },
        cmd = [
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/forma && ./relayer",  #
        ],
        user = User(uid = 0, gid = 0),
    )

    plan.add_service(name = service + "-relayer", config = relayer_service_config)

    lazy_validator_config = plan.upload_files(
        src = "{0}/validator.lazy.json".format(CONFIG_PATH),
        name = "lazy_forma_lazy_validator_config",
    )
    lazy_validator_service_config = ServiceConfig(
        image = AGENT_IMAGE_NAME,
        env_vars = {"CONFIG_FILES": "/etc/hyperlane/validator.lazy.json"},
        ports = {
            "grpc-port": PortSpec(number = 9090, transport_protocol = "TCP", application_protocol = "http"),
        },
        public_ports = {
            "grpc-port": PortSpec(number = constants.HYPERLANE[MODULE][CHAIN_A]["public_grpc_port"], transport_protocol = "TCP", application_protocol = "http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": lazy_validator_config,
        },
        cmd = [
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/forma && ./validator",  # sleep infinity
        ],
        user = User(uid = 0, gid = 0),
    )

    plan.add_service(name = service + "-lazy-validator", config = lazy_validator_service_config)

    forma_validator_config = plan.upload_files(
        src = "{0}/validator.forma.json".format(CONFIG_PATH),
        name = "lazy_forma_forma_validator_config",
    )

    forma_validator_service_config = ServiceConfig(
        image = AGENT_IMAGE_NAME,
        env_vars = {"CONFIG_FILES": "/etc/hyperlane/validator.forma.json"},
        ports = {
            "grpc-port": PortSpec(number = 9090, transport_protocol = "TCP", application_protocol = "http"),
        },
        public_ports = {
            "grpc-port": PortSpec(number = constants.HYPERLANE[MODULE][CHAIN_B]["public_grpc_port"], transport_protocol = "TCP", application_protocol = "http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": forma_validator_config,
        },
        cmd = [
            "/bin/sh",
            "-c",
            "mkdir -p /etc/data && mkdir -p /etc/validator/lazy && mkdir -p /etc/validator/forma && ./validator",
        ],
        user = User(uid = 0, gid = 0),
    )

    plan.add_service(name = service + "-forma-validator", config = forma_validator_service_config)

def render_agent_config(plan, data):
    config_file_template = read_file("{0}/agent-config.json.tmpl".format(CONFIG_PATH))
    agent_config_file = plan.render_templates(
        name = CONFIG_PATH + "-agent-configuration",
        config = {
            "agent-config.json": struct(
                template = config_file_template,
                data = data,
            ),
        },
    )
    return agent_config_file
