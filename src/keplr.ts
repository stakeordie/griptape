import { Keplr } from "@keplr-wallet/types";
import EventEmitter from "events";
import { Config } from "./types";
import { useDApp } from "./setup";

export type { Keplr } from "@keplr-wallet/types";

export async function getKeplr(): Promise<Keplr | undefined> {
  if (typeof window === 'undefined') return;

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

  async connect() {
    const keplr = await getKeplr();
    if (!keplr) throw new Error("Keplr is not installed");
    if (!this.isConnected()) {
      await keplr.enable(this.config.chainId);
    }
    this.keplr = keplr;
    return this;
  }

  isConnected(): boolean {
    return this.connected;
  }

  onConnect(fn: () => void) {
    this.emitter.on("connect", fn);
    return () => {
      this.emitter.removeListener("connect", fn);
    };
  }

  onDisconnect(fn: () => void) {
    this.emitter.on("disconnect", fn);
    return () => {
      this.emitter.removeListener("disconnect", fn);
    };
  }

  onConnectAndLoad(fn: () => void) {
    if (this.isConnected()) {
      fn();
    } else {
      this.emitter.on("connect", fn);
    }
    return () => {
      this.emitter.removeListener("connect", fn);
    };
  }
  
  setConnected() {
    this.connected = true;
    this.emitter.emit("connect");
  }

  unwrap(): Keplr {
    if (!this.keplr) throw new Error("Keplr is not installed");
    return this.keplr;
  }
}

export function withKeplr(): KeplrWrapper {
  const dapp = useDApp();
  return dapp.keplr;
}
