import { getNetwork, type Config } from "./config";
import { providers, Wallet } from "ethers";
import { Logger } from "./logger";

const logger = new Logger("eth-client");

export class EthClient {
  provider: providers.JsonRpcProvider;
  signer: Wallet;
  networkConfig: Config["networks"][number];

  constructor(networkId: string, mnemonic: string) {
    const networkConfig: Config["networks"][number] = getNetwork(networkId);
    const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
      networkConfig.endpoint
    );
    const wallet: Wallet = Wallet.fromMnemonic(mnemonic);
    const signer: Wallet = wallet.connect(provider);
    this.provider = provider;
    this.signer = signer;
    this.networkConfig = networkConfig;
    logger.success(
      `Signer Addr[${signer.address}] PubKey[${wallet.publicKey}]`
    );
  }
}
