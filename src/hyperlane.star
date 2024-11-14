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
                "mailbox_cosmos": "fromjson | .chains.{0}.mailbox_cosmos".format(chain),
                "validator_announce_cosmos": "fromjson | .chains.{0}.validator_announce_cosmos".format(chain),
                "mailbox": "fromjson | .chains.{0}.mailbox".format(chain),
                "validatorAnnounce": "fromjson | .chains.{0}.validatorAnnounce".format(chain),
            },
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
