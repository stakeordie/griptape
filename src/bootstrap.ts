import {
  CosmWasmClient,
  SigningCosmWasmClient
} from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { OfflineSigner, AccountData } from "@cosmjs/proto-signing";
import { Keplr } from "@keplr-wallet/types";

export interface Config {
  chainId: string;
  rpcEndpoint: string;
  prefix: string;
}

export class DApp {
  private config: Config;
  private callEntryPoint: () => void = () => {};
  client: CosmWasmClient | undefined;
  signingClient: SigningCosmWasmClient | undefined;
  account: AccountData | undefined;

  constructor(config: Config) {
    this.config = config;
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

    const setupSigner = (signer: OfflineSigner) => {
      const accountsPromise = signer.getAccounts();
      const signerPromise = Promise.resolve(signer);
      return Promise.all([signerPromise, accountsPromise]);
    };

    const setupAccount = (
      promises: [OfflineSigner, readonly AccountData[]]
    ) => {
      const [signer, [account]] = promises;
      this.account = account;
      const gasPrice = GasPrice.fromString("0.01ucosm");
      return SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, {
        prefix,
        gasPrice
      });
    };

    const setupSigningClient = (signingClient: SigningCosmWasmClient) =>
      (this.signingClient = signingClient);

    CosmWasmClient.connect(rpcEndpoint)
      .then(setupClient)
      .then(setupSigner)
      .then(setupAccount)
      .then(setupSigningClient)
      .finally(this.callEntryPoint);
  }

  connect(): void {
    const { rpcEndpoint } = this.config;

    CosmWasmClient.connect(rpcEndpoint)
      .then(client => (this.client = client))
      .finally(this.callEntryPoint);
  }
}

let dApp: DApp | undefined;

export function useDApp() {
  if (!dApp) throw new Error("No DApp has been created");
  return dApp;
}

/**
 * Creates a new dApp.
 * @param config A configuration object.
 * @returns DApp.
 */
export function createDApp(config: Config): DApp {
  if (dApp) throw new Error("Only one DApp instance is allowed.");
  dApp = new DApp(config);
  return dApp;
}

async function getKeplr(): Promise<Keplr | undefined> {
  if (window.keplr) {
    return window.keplr;
  }

  if (document.readyState === "complete") {
    return window.keplr;
  }

  return new Promise(resolve => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === "complete"
      ) {
        resolve(window.keplr);
        document.removeEventListener("readystatechange", documentStateChange);
      }
    };

    document.addEventListener("readystatechange", documentStateChange);
  });
}
