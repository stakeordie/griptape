import {
  CosmWasmClient,
  SigningCosmWasmClient
} from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { OfflineSigner, AccountData } from "@cosmjs/proto-signing";
import { Keplr } from "@keplr-wallet/types";

export interface Config {
  chainId: string;
  rpcEndpoint: string;
  prefix: string;
}

export class AppContext {
  config: Config;
  client: CosmWasmClient;
  signingClient?: SigningCosmWasmClient;
  account?: AccountData;

  constructor(
    config: Config,
    client: CosmWasmClient,
    signingClient?: SigningCosmWasmClient,
    account?: AccountData
  ) {
    this.config = config;
    this.client = client;
    this.signingClient = signingClient;
    this.account = account;
  }
}

let appContext: AppContext | undefined;

export async function initApp(
  config: Config,
  signer?: OfflineSigner
): Promise<void> {
  const { rpcEndpoint } = config;

  const client = await CosmWasmClient.connect(rpcEndpoint);

  let signingClient: SigningCosmWasmClient | undefined;
  let account: AccountData | undefined;
  if (signer) {
    account = (await signer.getAccounts())[0];

    signingClient = await SigningCosmWasmClient.connectWithSigner(
      rpcEndpoint,
      signer,
      {
        prefix: config.prefix,
        gasPrice: GasPrice.fromString("0.01ucosm")
      }
    );
  }

  appContext = new AppContext(config, client, signingClient, account);
}

export function useAppContext(): AppContext {
  if (!appContext)
    throw new Error(
      "App context has not been initialized: have you execute `initApp`?"
    );
  return appContext;
}

export async function initKeplr({
  chainId
}: Config): Promise<OfflineSigner | undefined> {
  const keplr = await getKeplr();
  if (!keplr) return;
  await keplr.enable(chainId);
  return keplr.getOfflineSignerAuto(chainId);
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
