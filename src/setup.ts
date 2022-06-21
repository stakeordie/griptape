import { Config } from "./types";
import { DApp } from "./dapp";

/**
 * The singleton DApp instance.
 */
let dApp: DApp | undefined;

/**
 * Get the active DApp instantce
 */
export function useDApp() {
  if (!dApp) throw new Error("No DApp instance has been created");
  return dApp;
}

/**
 * Creates a new dApp.
 * @param config A configuration object.
 * @returns DApp.
 */
export function createDApp(config: Config): DApp {
  if (dApp) throw new Error("Only one instance of a DApp is allowed");
  dApp = new DApp(config);
  return dApp;
}
