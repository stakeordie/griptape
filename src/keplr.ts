import { Keplr } from "@keplr-wallet/types";
import EventEmitter from "events";
import { Config } from "./types";

export type { Keplr } from "@keplr-wallet/types";

export async function getKeplr(): Promise<Keplr | undefined> {
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

export class KeplrWrapper {
  private emitter: EventEmitter;
  private connected: boolean = false;
  private keplr: Keplr | undefined;
  private config: Config;

  constructor(config: Config) {
    this.emitter = new EventEmitter();
    this.config = config;
  }

  private async setupKeplr() {
    const keplr = await getKeplr();
    if (!keplr) throw new Error("Keplr is not installed");
    if (!this.isConnected()) {
      await keplr.enable(this.config.chainId);
    }
    this.keplr = keplr;
  }

  isConnected(): boolean {
    return this.connected;
  }

  onConnect(fn: () => void) {
    this.emitter.on("connect", fn);
  }

  onDisconnect(fn: () => void) {
    this.emitter.on("disconnect", fn);
  }

  onConnectAndLoad(fn: () => void) {
    if (this.isConnected()) {
      fn();
    } else {
      this.emitter.on("connect", fn);
    }
  }

  async connect(): Promise<KeplrWrapper> {
    await this.setupKeplr();
    this.emitter.emit("connect");
    return this;
  }

  unwrap(): Keplr {
    if (!this.keplr) throw new Error("Keplr is not installed");
    return this.keplr;
  }
}
