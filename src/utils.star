constants = import_module("./constants.star")

CLEAN = " | sed 's/\"//g;' | tr '\n' ' ' | tr -d ' '"

def read_file_from_service(plan, service_name, filename):
    file_content = plan.exec(
        service_name=service_name,
        description="Reading {} from {}".format(filename, service_name),
        recipe=ExecRecipe(
            command=["/bin/sh", "-c", "cat {} | tr -d '\n'".format(filename)]
        ),
    )["output"]
    return file_content

def get_wallet_addr(plan, service_name,app,wallet_name):
    cmd = "{0} keys list --keyring-backend test --output json".format(app)
    # note: format remove \", so we need to concanate them
    filter = " | jq -r '[.[] | {(.name): .address}] | tostring | fromjson | reduce .[] as $item ({} ; . + $item)' | jq '."+ wallet_name + "'" + CLEAN
    
    exec = cmd + filter
    wallet_addr = plan.exec(
        description="Getting {} Address".format(wallet_name),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                exec,
            ]
        ),
    )["output"]
    return wallet_addr

def get_wallet_pubkey(plan, service_name,app,wallet_name):
    cmd = "{0} keys list --keyring-backend test --output json".format(app)
    # get a map {name: pkey}
    filter_1 = "jq -r '[.[] | {(.name): .pubkey}] | reduce .[] as $item ({} ; . + $item)'"
    # this remove the 'literals' for pkey field
    filter_2 = "tr -d \\\\\\\\ " + "| sed 's/\"{/{/g;' | sed 's/}\"/}/g;'"
    # get wallet pkey
    filter_3 = "jq '.{0}.key'".format(wallet_name)

    exec = "{0} | {1} | {2} | {3}".format(cmd, filter_1, filter_2, filter_3) + CLEAN
    plan.print(exec)
    wallet_pkey = plan.exec(
        description="Getting pkey {} Address".format(wallet_name),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                exec,
            ]
        ),
    )["output"]
    return wallet_pkey

def export_wallet(plan, service_name, app, wallet_name):
    cmd = "echo \"Y\" | {0} keys export {1} --keyring-backend test --unsafe  --unarmored-hex".format(app,wallet_name) + CLEAN
    wallet_export = plan.exec(
        description="Getting pkey {} Address".format(wallet_name),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                cmd,
            ]
        ),
    )["output"]
    return wallet_export


# geth account new
def create_account(plan,service_name,app,wallet_name,mnemonics):
    # Create development account
    # Note: if we use  --coin-type 60, we can get an ETH compatible addr just for checking that both lazy and stargaze have the same eth addr
    cmd = "echo \"{0}\" | {1} keys add {2} --keyring-backend test --recover".format(mnemonics,app,wallet_name)
    create_wallet = plan.exec(
        description="Creating Development Account {0}".format(wallet_name),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                cmd,
            ]
        ),
    )["output"]
    return create_wallet

def fund_wallet(plan,service_name,app,from_wallet,to_wallet,qtty,fees,denom):
    from_addr = get_wallet_addr(plan, service_name,app,from_wallet)
    to_addr = get_wallet_addr(plan, service_name,app,to_wallet)

    cmd = "{5} tx bank send {0} {1} {3}{2} --keyring-backend test --fees {4}{2} -y --output json 2> /dev/null".format(from_addr,to_addr,denom,qtty,fees,app)
    filter=" | jq '.txhash'" + CLEAN

    exec = cmd + filter
    plan.exec(
        description="Sending {0}:{1}{2} -> {3}".format(from_addr,qtty,denom,to_addr),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                exec,
            ]
        ),
    )["output"]
    balances=query_balance(plan,service_name,app,to_addr)

    return balances

def query_balance(plan,service_name,app,addr):
    cmd="sleep {1} && {2} query bank balances {0} --output json".format(addr,constants.SLEEP,app)
    filter=" | jq '.balances'"

    exec = cmd + filter
    balance = plan.exec(
        description="Checking dev wallet balance {0}".format(addr),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                exec,
            ]
        ),
    )["output"]
    return balance

def instantiate(plan,service_name,app,code_id, wallet_owner,init_msg,label):
    # note: format remove \", so we need to concanate them
    cmd="{0} tx wasm instantiate {1} '".format(app, code_id)+init_msg+"' --keyring-backend test --label '{0}' --no-admin --output json -y --from {1} 2> /dev/null".format(label,wallet_owner)
    filter=" | jq '.txhash'" + CLEAN
    exec = cmd + filter
    tx_hash = plan.exec(
        description="Instance contract {0}: {1}".format(code_id,label),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                exec,
            ]
        ),
    )["output"]
    contract_addr=parse_txhash(plan,service_name,app,tx_hash,"instantiate","_contract_address")
    return contract_addr

def parse_txhash(plan,service_name,app,tx_hash,event_type,event_key):
    filter = get_filter_exp(event_type,event_key)
    cmd="sleep {0} && {1} q tx {2}".format(constants.SLEEP,app,tx_hash) + " --output json | " + filter
    text = plan.exec(
        description="txhash {0}".format(tx_hash),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                cmd,
            ]
        ),
    )["output"]
    return text

def get_filter_exp(event_type,event_key):
    filter = "jq -r '.events | .[] | select(.type == " + '\"{}\"'.format(event_type) + ") | .attributes | .[] | select(.key == "+ '\"{0}\"'.format(event_key) + ") | .value' | sed 's/\"//g;' | tr '\n' ' ' | tr -d ' '"
    return filter

def deploy_contracts(plan,service_name,app,contracts_list,wallet_name,denom):
    contracts = {}
    for contract_name in contracts_list:
        contract_code_id=deploy_contract(plan,service_name,app,contract_name,wallet_name,denom)
        contracts.update({contract_name: { "code_id": contract_code_id, "addr": ""}})
    return contracts

def deploy_contract(plan, service_name,app,contract_name,wallet_name,denom):

    # deploy hyperlane smart contracts
    cmd="{3} tx wasm store {0}.wasm --keyring-backend test --gas-prices 0.025{1} --gas auto --gas-adjustment 1.7 --output json -y --from {2} 2> /dev/null".format(contract_name,denom,wallet_name,app)
    filter=" | jq '.txhash'" + CLEAN
    exec = cmd + filter

    tx_hash = plan.exec(
        description="Deploying smart contract [{0}]".format(contract_name),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                exec,
            ]
        ),
    )["output"]

    contract_code_id=parse_txhash(plan,service_name,app,tx_hash,"store_code","code_id")
    return contract_code_id

def download_artifacts(plan,service_name,url):
    cmd="curl -s -L -O {}".format(url)
    download = plan.exec(
        description="Downloading artifact from {}".format(url),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                cmd,
            ]
        ),
    )["output"]

def decompress(plan,service_name,file_name):
    cmd="unzip -q {}".format(file_name)
    download = plan.exec(
        description="Decompressing artifact {}".format(file_name),
        service_name=service_name,
        recipe=ExecRecipe(
            command=[
                "/bin/sh",
                "-c",
                cmd,
            ]
        ),
    )["output"]