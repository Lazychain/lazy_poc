utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

SERVICE_NAME = "hyperlane-local"
IMAGE_NAME = "gcr.io/abacus-labs-dev/hyperlane-agent:3bb4d87-20240129-164519"

def run(
    plan,
    args={}
):

    plan.print("Starting {} service".format(SERVICE_NAME))

    # load agent-config.json file as a volume file
    agent_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/agent-config.json",
        name="agent_config",
    )

    # load relayer.json file as a volume file
    relayer_config = plan.upload_files(
        src=static_files.HYPERLANE_CONFIG_DIRPATH+"/relayer.json",
        name="relayer_config",
    )

    ENV_VARS = {}
    ENV_VARS["CONFIG_FILES"]="/etc/hyperlane/relayer.json"


    relayer_service_config = ServiceConfig(
        image=IMAGE_NAME,
        env_vars=ENV_VARS,
        ports={ 
            "grpc-port": PortSpec(number=9090, transport_protocol="TCP", application_protocol="http"),
        },
        public_ports={ 
            "grpc-port": PortSpec(number=constants.HYPERLANE["relayer"]["grpc_port"], transport_protocol="TCP", application_protocol="http"),
        },
        files = {
            "/app/config": agent_config,
            "/etc/hyperlane": relayer_config,
            },
        
        # cmd=[
        #     "/bin/sh",
        #     "-c",
        #     "sleep infinity",
        # ],
    )

    relayer = plan.add_service(name=SERVICE_NAME+"-relayer",config=relayer_service_config)