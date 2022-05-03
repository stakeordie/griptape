import {
  CosmWasmClient,
  SigningCosmWasmClient
} from "@cosmjs/cosmwasm-stargate";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { Keplr } from "@keplr-wallet/types";

export interface Config {
  chainId: string;
  rpcEndpoint: string;
  prefix: string;
}

class AppContext {
  config: Config;
  client: CosmWasmClient;
  signingClient?: SigningCosmWasmClient;

  constructor(
    config: Config,
    client: CosmWasmClient,
    signingClient?: SigningCosmWasmClient
  ) {
    this.config = config;
    this.client = client;
    this.signingClient = signingClient;
  }
}

export let appContext: AppContext;

export async function initApp(
  config: Config,
  signer?: OfflineSigner
): Promise<void> {
  const { rpcEndpoint } = config;

  const client = await CosmWasmClient.connect(rpcEndpoint);

  let signingClient: SigningCosmWasmClient | undefined;
  if (signer) {
    signingClient = await SigningCosmWasmClient.connectWithSigner(
      rpcEndpoint,
      signer,
      {
        prefix: config.prefix
      }
    );
  }

  appContext = new AppContext(config, client, signingClient);
}

export async function initKeplr(): Promise<OfflineSigner | undefined> {
  const keplr = await getKeplr();
  if (!keplr) return;
  return keplr.getOfflineSignerAuto(appContext.config.chainId);
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
