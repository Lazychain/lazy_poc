GLOBAL_LOG_LEVEL = struct(
    info="info",
    error="error",
    warn="warn",
    debug="debug",
    trace="trace",
)

SLEEP = "6"

# Astria - add 50051 for GRPC
# EXPOSE 8545 8546 30303 30303/udp 50051
FORMA = {
    "public_grpc_port": 50051,
    "public_json_rpc_port": 8546,
    "public_ws_port": 8551,
}

LAZY = {
    "public_rpc_port": 26657,
    "public_p2p_port": 26656,
    "public_proxy_port": 26658,
    "public_grpc_port": 9090,
    "public_grpc_web_port": 9091,
    "public_json_rpc_port": 8545,
    "public_rest_port": 1317,
}

CELESTIA= {
    "validator_grpc_port": 8091,
    "validator_rpc_port": 20657,
    "bridge_rpc_port": 20658,
    "bridge_rest_port": 20659
}

STARGAZE= {
    "public_rpc_port": 21657,
    "public_p2p_port": 21656,
    "public_rest_port": 1316,
    "public_grpc_port": 8090,
  }

HYPERLANE= {
    "lazy-stargaze": {
        "relayer": {
            "public_grpc_port": 9110
        },
        "lazy_validator": {
            "public_grpc_port": 9120
        },
        "stargaze_validator": {
            "public_grpc_port": 9121
        }
    },
    "lazy-forma":{
        "relayer": {
            "public_grpc_port": 9310
        },
        "lazy_validator": {
            "public_grpc_port": 9320
        },
        "forma_validator": {
            "public_grpc_port": 9321
        }
    }

}

BLOCKSCOUT = {
    "redis": {
        "image": "redis:alpine",
        "command": ["redis-server"],
        "ports": {
            "6379": PortSpec(number=6379,transport_protocol="TCP",application_protocol="http"),
        }
    },
    
    "db": {
        "image": "postgres",
        "environment": {
            "POSTGRES_DB": 'blockscout',
            "POSTGRES_USER": 'blockscout',
            "POSTGRES_PASSWORD": 'ceWb1MeLBEeOIfk65gU8EjF8',
        },
        "ports": {
            "7432": PortSpec(number=7432,transport_protocol="TCP",application_protocol="postgresql"),
            "5432": PortSpec(number=5432,transport_protocol="TCP",application_protocol="postgresql"),
        },
    },
    "stats-db":{
        "image": "postgres",
        "environment": {
            "POSTGRES_DB": 'stats',
            "POSTGRES_USER": 'stats',
            "POSTGRES_PASSWORD": 'n0uejXPl61ci6ldCuE2gQU5Y',
        },
        "ports": {
            "7433": PortSpec(number=7433,transport_protocol="TCP",application_protocol="postgresql"),
            "5432": PortSpec(number=5432,transport_protocol="TCP",application_protocol="postgresql"),
        },
    },
    "backend": {
        "image": "blockscout/blockscout:latest",
        "command": "export $(grep -v '^#' ./envs/common-blockscout.env | xargs) && bin/blockscout eval \"Elixir.Explorer.ReleaseTasks.create_and_migrate()\" && bin/blockscout start",
    },
    "visualizer":{
        "image": "ghcr.io/blockscout/visualizer:latest",
        "files": {
            "common-visualizer": "../envs/common-visualizer.env",
        },
    },
    "sig-provider": {
        "image": "ghcr.io/blockscout/sig-provider:latest",
    },
    "frontend": {
        "image": "ghcr.io/blockscout/frontend:latest",
        "files": {
            "common-frontend": "../envs/common-frontend.env",
        },
    },

    "stats": {
        "image": "ghcr.io/blockscout/stats:latest",
        "files": {
            "common-stats": "../envs/common-stats.env",
        },
        "environment": {
            "STATS__DB_URL": "postgres://stats:n0uejXPl61ci6ldCuE2gQU5Y@stats-db:5432/stats",
            "STATS__BLOCKSCOUT_DB_URL": "postgresql://blockscout:ceWb1MeLBEeOIfk65gU8EjF8@db:5432/blockscout",
            "STATS__CREATE_DATABASE": "true",
            "STATS__RUN_MIGRATIONS": "true",
            "STATS__IGNORE_BLOCKSCOUT_API_ABSENCE": "true",
        }
    },
    "user-ops-indexer": {
        "image": "ghcr.io/blockscout/user-ops-indexer:latest",
        "files": {
            "common-user-ops-indexer": "../envs/common-user-ops-indexer.env",
        },
        "environment": {
            "USER_OPS_INDEXER__INDEXER__RPC_URL": "ws://host.docker.internal:8545/",
            "USER_OPS_INDEXER__DATABASE__CONNECT__URL": "postgresql://blockscout:ceWb1MeLBEeOIfk65gU8EjF8@db:5432/blockscout",
            "USER_OPS_INDEXER__DATABASE__RUN_MIGRATIONS": "true",
        }
    },
    "proxy": {
        "image": "nginx",
        "environment": {
            "BACK_PROXY_PASS": "http://backend:4000",
            "FRONT_PROXY_PASS": "http://frontend:3000",
        },
        "ports": {
            "80": PortSpec(number=80,transport_protocol="TCP",application_protocol="http"),
            "8080": PortSpec(number=8080,transport_protocol="TCP",application_protocol="http"),
            "8082": PortSpec(number=8082,transport_protocol="TCP",application_protocol="http"),
        },
    }
}
