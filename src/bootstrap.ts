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
  client: CosmWasmClient | undefined;
  signingClient: SigningCosmWasmClient | undefined;
  account: AccountData | undefined;
  private entryPoint: (() => void) | undefined;

  static from(config: Config) {
    return new DApp(config);
  }

  protected constructor(config: Config) {
    this.config = config;
  }

  setEntryPoint(entryPoint: () => void): DApp {
    this.entryPoint = entryPoint;
    return this;
  }

  connectWithMnemonic(mnemonic: string): void {
    const { rpcEndpoint, prefix } = this.config;
    CosmWasmClient.connect(rpcEndpoint)
      .then(client => {
        this.client = client;
        return DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix });
      })
      .then(signer => {
        const accountsPromise = signer.getAccounts();
        const signerPromise = Promise.resolve(signer);
        return Promise.all([signerPromise, accountsPromise]);
      })
      .then(promises => {
        const [signer, [account]] = promises;
        this.account = account;
        const gasPrice = GasPrice.fromString("0.01ucosm");
        return SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, {
          prefix,
          gasPrice
        });
      })
      .then(signingClient => (this.signingClient = signingClient))
      .finally(() => {
        if (this.entryPoint) this.entryPoint();
      });
  }

  connect(): void {
    const { rpcEndpoint } = this.config;
    CosmWasmClient.connect(rpcEndpoint)
      .then(client => {
        this.client = client;
      })
      .finally(() => {
        if (this.entryPoint) this.entryPoint();
      });
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
 * @returns DApp
 */
export function createDApp(config: Config): DApp {
  dApp = DApp.from(config);
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
