import {
  CosmWasmClient,
  SigningCosmWasmClient
} from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { OfflineSigner, AccountData } from "@cosmjs/proto-signing";
import { KeplrWrapper } from "./keplr";
import { Config } from "./types";

export class DApp {
  private config: Config;
  private callEntryPoint: () => void = () => {};
  client: CosmWasmClient | undefined;
  signingClient: SigningCosmWasmClient | undefined;
  account: AccountData | undefined;
  keplr: KeplrWrapper;

  constructor(config: Config) {
    this.config = config;
    this.keplr = new KeplrWrapper(config);
  }

  setEntryPoint(entryPoint: () => void): DApp {
    this.callEntryPoint = entryPoint;
    return this;
  }

  connectWithMnemonic(mnemonic: string): void {
    const { rpcEndpoint, prefix } = this.config;

    const setupClient = (client: CosmWasmClient) => {
      this.client = client;
      return DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix });
    };

    CosmWasmClient.connect(rpcEndpoint)
      .then(setupClient)
      .then(this.setupSigner.bind(this))
      .then(this.setupAccount.bind(this))
      .then(this.setupSigningClient.bind(this))
      .finally(this.callEntryPoint);
  }

  connect(): void {
    const { rpcEndpoint } = this.config;

    CosmWasmClient.connect(rpcEndpoint)
      .then(client => (this.client = client))
      .finally(this.callEntryPoint);
  }

  connectWithKeplr(): void {
    const { rpcEndpoint, chainId } = this.config;

    const setupClientAndApp = (client: CosmWasmClient) => {
      this.client = client;
      this.callEntryPoint();
      return this.keplr.connect();
    };

    const setupKeplr = (keplr: KeplrWrapper) => {
      return keplr.unwrap().getOfflineSignerAuto(chainId);
    };

    CosmWasmClient.connect(rpcEndpoint)
      .then(setupClientAndApp)
      .then(setupKeplr)
      .then(this.setupSigner.bind(this))
      .then(this.setupAccount.bind(this))
      .then(this.setupSigningClient.bind(this));
  }

  private setupSigner(signer: OfflineSigner) {
    const accountsPromise = signer.getAccounts();
    const signerPromise = Promise.resolve(signer);
    return Promise.all([signerPromise, accountsPromise]);
  }

  private setupAccount(promises: [OfflineSigner, readonly AccountData[]]) {
    const { rpcEndpoint, prefix } = this.config;
    const [signer, [account]] = promises;
    this.account = account;
    const gasPrice = GasPrice.fromString("0.01ucosm");
    return SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, {
      prefix,
      gasPrice
    });
  }

  private setupSigningClient(signingClient: SigningCosmWasmClient) {
    this.signingClient = signingClient;
  }
}
