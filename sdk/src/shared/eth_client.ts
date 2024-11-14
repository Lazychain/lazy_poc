import { getNetwork, type Config } from "./config";
import { providers, Wallet } from "ethers";

export class EthClient {
  provider: providers.JsonRpcProvider;
  signer: Wallet;
  networkConfig: Config["networks"][number];

  constructor(networkId: string, mnemonic: string) {
    const networkConfig: Config["networks"][number] = getNetwork(networkId);
    console.log(networkConfig.endpoint.jsonrpc);
    const endpoint = networkConfig.endpoint;

    const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
      endpoint.jsonrpc
    );
    const wallet: Wallet = Wallet.fromMnemonic(mnemonic);
    const signer: Wallet = wallet.connect(provider);
    this.provider = provider;
    this.signer = signer;
    this.networkConfig = networkConfig;
  }
}
