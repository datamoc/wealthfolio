import * as tauri from "./tauri";
import * as web from "./web";

/**
 * An enumeration of possible runtime environments.
 * This helps in conditionally executing platform-specific code.
 */
export enum RUN_ENV {
  /** The application is running as a Tauri desktop application. */
  DESKTOP = "desktop",
  /** The application is running in a web browser. */
  WEB = "web",
  /** The runtime environment is not supported (e.g., server-side rendering). */
  UNSUPPORTED = "unsupported",
}

declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

/**
 * Determines the current runtime environment by checking for the presence of
 * Tauri-specific or web-specific global variables.
 *
 * @returns {RUN_ENV} The detected runtime environment.
 */
export const getRunEnv = (): RUN_ENV => {
  if (typeof window !== "undefined" && window.__TAURI__) {
    return RUN_ENV.DESKTOP;
  }
  if (typeof window !== "undefined") {
    return RUN_ENV.WEB;
  }
  return RUN_ENV.UNSUPPORTED;
};

/** A function to invoke Tauri commands, available only in the desktop environment. */
export const invokeTauri = tauri.invokeTauri;
/** A function to make API calls to the web server, available only in the web environment. */
export const invokeWeb = web.invokeWeb;

/** A platform-specific logger that uses the Tauri logger in desktop and the console logger in web. */
export const logger = getRunEnv() === RUN_ENV.DESKTOP ? tauri.logger : web.logger;

/**
 * Re-exporting types for Tauri event handling.
 * @see {@link ./tauri.ts}
 */
export type { EventCallback, UnlistenFn } from "./tauri";

/**
 * Re-exporting functions for Tauri-specific functionality.
 * These functions are intended to be used in the desktop environment.
 * @see {@link ./tauri.ts}
 */
export {
  openCsvFileDialogTauri,
  openFolderDialogTauri,
  openDatabaseFileDialogTauri,
  listenFileDropHoverTauri,
  listenFileDropTauri,
  listenFileDropCancelledTauri,
  listenPortfolioUpdateStartTauri,
  listenPortfolioUpdateCompleteTauri,
  listenDatabaseRestoredTauri,
  listenPortfolioUpdateErrorTauri,
  openFileSaveDialogTauri,
  listenMarketSyncCompleteTauri,
  listenMarketSyncStartTauri,
  listenNavigateToRouteTauri,
} from "./tauri";

/**
 * Re-exporting all functions from the web adapter.
 * These functions are intended to be used in the web environment.
 * @see {@link ./web.ts}
 */
export * from "./web";
