"""Hyperlane infrastructure spammer"""
utils = import_module("./utils.star")
static_files = import_module("./static_files/static_files.star")
constants = import_module("./constants.star")

def get_cosmos_address(plan, service, chain):
    response = plan.exec(
        service_name = service,
        recipe = ExecRecipe(
            command = ["/bin/sh", "-c", "cat chains.json"],
            extract = {
                "interchainGasPaymaster": "fromjson | .chains.{0}.interchainGasPaymaster".format(chain),
                "merkleTreeHook": "fromjson | .chains.{0}.merkleTreeHook".format(chain),
                "mailbox": "fromjson | .chains.{0}.mailbox".format(chain),
                "validatorAnnounce": "fromjson | .chains.{0}.validatorAnnounce".format(chain),
                "mailbox_c": "fromjson | .chains.{0}_xt.mailbox".format(chain),
                "validator_announce": "fromjson | .chains.{0}_xt.validator_announce".format(chain),
                "hpl_ism_multisig": "fromjson | .chains.{0}_xt.hpl_ism_multisig".format(chain),
                "hpl_igp_oracle": "fromjson | .chains.{0}_xt.hpl_igp_oracle".format(chain),
                "hpl_hook_aggregate": "fromjson | .chains.{0}_xt.hpl_hook_aggregate".format(chain),
                "hpl_hook_fee": "fromjson | .chains.{0}_xt.hpl_hook_fee".format(chain),
                "hpl_hook_merkle": "fromjson | .chains.{0}_xt.hpl_hook_merkle".format(chain),
                "hpl_igp": "fromjson | .chains.{0}_xt.hpl_igp".format(chain),
            },
        ),
    )
    return {
        "interchain_gas_paymaster_hex": response["extract.interchainGasPaymaster"],
        "merkle_tree_hook_hex": response["extract.merkleTreeHook"],
        "mailbox_hex": response["extract.mailbox"],
        "validator_announce_hex": response["extract.validatorAnnounce"],
        "mailbox": response["extract.mailbox_c"],
        "validator_announce": response["extract.validator_announce"],
        "hpl_ism_multisig": response["extract.hpl_ism_multisig"],
        "hpl_igp_oracle": response["extract.hpl_igp_oracle"],
        "hpl_hook_aggregate": response["extract.hpl_hook_aggregate"],
        "hpl_hook_fee": response["extract.hpl_hook_fee"],
        "hpl_hook_merkle": response["extract.hpl_hook_merkle"],
        "hpl_igp": response["extract.hpl_igp"],
    }

def get_eth_address(plan, service, chain):
    response = plan.exec(
        service_name = service,
        recipe = ExecRecipe(
            command = ["/bin/sh", "-c", "cat chains.json"],
            extract = {
                "domainRoutingIsmFactory": "fromjson | .chains.{0}.domainRoutingIsmFactory".format(chain),
                "interchainAccountIsm": "fromjson | .chains.{0}.interchainAccountIsm".format(chain),
                "interchainAccountRouter": "fromjson | .chains.{0}.interchainAccountRouter".format(chain),
                "mailbox": "fromjson | .chains.{0}.mailbox".format(chain),
                "merkleTreeHook": "fromjson | .chains.{0}.merkleTreeHook".format(chain),
                "proxyAdmin": "fromjson | .chains.{0}.proxyAdmin".format(chain),
                "staticAggregationHookFactory": "fromjson | .chains.{0}.staticAggregationHookFactory".format(chain),
                "staticAggregationIsmFactory": "fromjson | .chains.{0}.staticAggregationIsmFactory".format(chain),
                "staticMerkleRootMultisigIsmFactory": "fromjson | .chains.{0}.staticMerkleRootMultisigIsmFactory".format(chain),
                "staticMerkleRootWeightedMultisigIsmFactory": "fromjson | .chains.{0}.staticMerkleRootWeightedMultisigIsmFactory".format(chain),
                "staticMessageIdMultisigIsmFactory": "fromjson | .chains.{0}.staticMessageIdMultisigIsmFactory".format(chain),
                "staticMessageIdWeightedMultisigIsmFactory": "fromjson | .chains.{0}.staticMessageIdWeightedMultisigIsmFactory".format(chain),
                "testRecipient": "fromjson | .chains.{0}.testRecipient".format(chain),
                "validatorAnnounce": "fromjson | .chains.{0}.validatorAnnounce".format(chain),
            },
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
