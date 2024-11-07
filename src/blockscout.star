utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

SERVICE_NAME = "blockscout-local"
BLOCKSCOUT_CONFIG_DIRPATH_ON_SERVICE = "/data"

def run(
    plan,
    args={}
):

    #####
    # Blockscout
    #####

    plan.print("Starting {} service".format(SERVICE_NAME))

    # service_config=ServiceConfig(
    #     image=constants.BLOCKSCOUT["redis"]["image"],
    #     cmd=constants.BLOCKSCOUT["redis"]["command"],
    #     ports={ 
    #         "service": constants.BLOCKSCOUT["redis"]["ports"]["6379"],
    #     },
    #     public_ports={ 
    #         "service": constants.BLOCKSCOUT["redis"]["ports"]["6379"],
    #     },
    # )
    # bs_redis = plan.add_service(name=SERVICE_NAME+"-redis",config=service_config)

    service_config=ServiceConfig(
        image=constants.BLOCKSCOUT["db"]["image"],
        env_vars=constants.BLOCKSCOUT["db"]["environment"],
        ports={ 
            "service": constants.BLOCKSCOUT["db"]["ports"]["5432"],
        },
        public_ports={ 
            "service": constants.BLOCKSCOUT["db"]["ports"]["7432"],
        },
    )
    bs_db = plan.add_service(name=SERVICE_NAME+"-db",config=service_config)

    postgres_url = "postgresql://{}:{}@{}:{}/{}".format(
        constants.BLOCKSCOUT["db"]["environment"]["POSTGRES_USER"],
        constants.BLOCKSCOUT["db"]["environment"]["POSTGRES_PASSWORD"],
        bs_db.ip_address,
        5432,
        constants.BLOCKSCOUT["db"]["environment"]["POSTGRES_DB"],
    )

    # service_config=ServiceConfig(
    #     image=constants.BLOCKSCOUT["stats-db"]["image"],
    #     env_vars=constants.BLOCKSCOUT["stats-db"]["environment"],
    #     ports={ 
    #         "service": constants.BLOCKSCOUT["stats-db"]["ports"]["5432"],
    #     },
    #     public_ports={ 
    #         "service": constants.BLOCKSCOUT["stats-db"]["ports"]["7433"],
    #     },
    # )
    # stats_db = plan.add_service(name=SERVICE_NAME+"-stas-db",config=service_config)

    # load common-blockscout.env file as a volume file
    blockscout_config = plan.upload_files(
        src=static_files.BLOCKSCOUT_CONFIG_DIRPATH+"/common-blockscout.env",
        name="blockscout_config",
    )

    service_config=ServiceConfig(
        image=constants.BLOCKSCOUT["backend"]["image"],
        env_vars={
            "DATABASE_URL": postgres_url
            # PGPASSWORD=ceWb1MeLBEeOIfk65gU8EjF8 psql -h 172.16.0.4 -p 5432 -U blockscout -d blockscout -c "select * from pg_catalog.pg_tables"
            # ETHEREUM_JSONRPC_VARIANT=geth
            # ETHEREUM_JSONRPC_HTTP_URL=http://host.docker.internal:8545/
            # ETHEREUM_JSONRPC_TRACE_URL=http://host.docker.internal:8545/
        },
        cmd =[
             "/bin/sh",
             "-c",
             "sleep 1d"
             # constants.BLOCKSCOUT["backend"]["command"],
        ],        
        files = {
            "/app/envs": blockscout_config,
        },
    )
    backend = plan.add_service(name=SERVICE_NAME+"-backend",config=service_config)
    plan.print(postgres_url)
    plan.print("docker exec -it --user=root blockscout-local-backend- sh")
    plan.print("apk update && apk add postgresql-client && pg_isready -d blockscout -h 127.0.0.1 -p 7432 -U blockscout")
    # return {
    #     "redis": bs_redis,
    #     "db": bs_db,
    #     "stats_db": stats_db,
    #     "backend": backend
    # }