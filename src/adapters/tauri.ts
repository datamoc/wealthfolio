import { invoke } from "@tauri-apps/api/core";
import type { EventCallback, UnlistenFn } from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, writeFile } from "@tauri-apps/plugin-fs";
import { debug, error, info, trace, warn } from "@tauri-apps/plugin-log";

export type { EventCallback, UnlistenFn };

import type {
  AddonInstallResult,
  AddonManifest,
  AddonUpdateCheckResult,
  AddonUpdateInfo,
  AddonValidationResult,
  AddonFile as BaseAddonFile,
  FunctionPermission,
  Permission,
} from "@wealthfolio/addon-sdk";

/**
 * Tauri-specific addon file type.
 * Overrides `is_main` with `isMain` to match Rust's camelCase serialization.
 */
export interface AddonFile extends Omit<BaseAddonFile, "is_main"> {
  /** Whether this is the main entry file for the addon. */
  isMain: boolean;
}

// Re-export SDK types directly
export type {
  AddonInstallResult,
  AddonManifest,
  AddonUpdateCheckResult,
  AddonUpdateInfo,
  AddonValidationResult,
  FunctionPermission,
  Permission,
};

/** Represents an addon that has been extracted from a ZIP file. */
export interface ExtractedAddon {
  /** The manifest of the addon. */
  metadata: AddonManifest;
  /** The files contained within the addon. */
  files: AddonFile[];
}

/** Represents an addon that has been installed in the application. */
export interface InstalledAddon {
  /** The manifest of the addon. */
  metadata: AddonManifest;
  /** File path where the addon is stored (Tauri-specific). */
  filePath: string;
  /** Whether this is a ZIP-based addon (Tauri-specific). */
  isZipAddon: boolean;
}

/**
 * Invokes a Tauri command with an optional payload.
 *
 * @template T The expected return type of the command.
 * @param {string} command The name of the Tauri command to invoke.
 * @param {Record<string, unknown>} [payload] The payload to send with the command.
 * @returns {Promise<T>} A promise that resolves with the result of the command.
 */
export const invokeTauri = async <T>(command: string, payload?: Record<string, unknown>) => {
  return await invoke<T>(command, payload);
};

/**
 * Extracts the contents of an addon ZIP file.
 *
 * @param {Uint8Array} zipData The binary data of the ZIP file.
 * @returns {Promise<ExtractedAddon>} A promise that resolves with the extracted addon data.
 */
export const extractAddonZip = async (zipData: Uint8Array): Promise<ExtractedAddon> => {
  return await invoke<ExtractedAddon>("extract_addon_zip", { zipData: Array.from(zipData) });
};

/**
 * Installs an addon from a ZIP file.
 *
 * @param {Uint8Array} zipData The binary data of the ZIP file.
 * @param {boolean} [enableAfterInstall] Whether to enable the addon after installation.
 * @returns {Promise<AddonManifest>} A promise that resolves with the manifest of the installed addon.
 */
export const installAddonZip = async (
  zipData: Uint8Array,
  enableAfterInstall?: boolean,
): Promise<AddonManifest> => {
  return await invoke<AddonManifest>("install_addon_zip", {
    zipData: Array.from(zipData),
    enableAfterInstall,
  });
};

/**
 * Installs an addon from a single file.
 *
 * @param {string} fileName The name of the addon file.
 * @param {string} fileContent The content of the addon file.
 * @param {boolean} [enableAfterInstall] Whether to enable the addon after installation.
 * @returns {Promise<AddonManifest>} A promise that resolves with the manifest of the installed addon.
 */
export const installAddonFile = async (
  fileName: string,
  fileContent: string,
  enableAfterInstall?: boolean,
): Promise<AddonManifest> => {
  return await invoke<AddonManifest>("install_addon_file", {
    fileName,
    fileContent,
    enableAfterInstall,
  });
};

/**
 * Lists all installed addons.
 *
 * @returns {Promise<InstalledAddon[]>} A promise that resolves with a list of installed addons.
 */
export const listInstalledAddons = async (): Promise<InstalledAddon[]> => {
  return await invoke<InstalledAddon[]>("list_installed_addons");
};

/**
 * Toggles the enabled state of an addon.
 *
 * @param {string} addonId The ID of the addon to toggle.
 * @param {boolean} enabled The desired enabled state.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const toggleAddon = async (addonId: string, enabled: boolean): Promise<void> => {
  return await invoke<void>("toggle_addon", { addonId, enabled });
};

/**
 * Uninstalls an addon.
 *
 * @param {string} addonId The ID of the addon to uninstall.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const uninstallAddon = async (addonId: string): Promise<void> => {
  return await invoke<void>("uninstall_addon", { addonId });
};

/**
 * Loads an addon for the runtime.
 *
 * @param {string} addonId The ID of the addon to load.
 * @returns {Promise<ExtractedAddon>} A promise that resolves with the loaded addon data.
 */
export const loadAddonForRuntime = async (addonId: string): Promise<ExtractedAddon> => {
  return await invoke<ExtractedAddon>("load_addon_for_runtime", { addonId });
};

/**
 * Gets all enabled addons on startup.
 *
 * @returns {Promise<ExtractedAddon[]>} A promise that resolves with a list of enabled addons.
 */
export const getEnabledAddonsOnStartup = async (): Promise<ExtractedAddon[]> => {
  return await invoke<ExtractedAddon[]>("get_enabled_addons_on_startup");
};

/**
 * Opens a file dialog to select a CSV file.
 *
 * @returns {Promise<null | string | string[]>} A promise that resolves with the selected file path(s), or null if canceled.
 */
export const openCsvFileDialogTauri = async (): Promise<null | string | string[]> => {
  return open({ filters: [{ name: "CSV", extensions: ["csv"] }] });
};

/**
 * Opens a dialog to select a folder.
 *
 * @returns {Promise<string | null>} A promise that resolves with the selected folder path, or null if canceled.
 */
export const openFolderDialogTauri = async (): Promise<string | null> => {
  return open({ directory: true });
};

/**
 * Opens a file dialog to select a database file.
 *
 * @returns {Promise<string | null>} A promise that resolves with the selected file path, or null if canceled.
 */
export const openDatabaseFileDialogTauri = async (): Promise<string | null> => {
  const result = await open();
  return Array.isArray(result) ? (result[0] ?? null) : result;
};

/**
 * Listens for a file drop hover event.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenFileDropHoverTauri = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  return listen<T>("tauri://file-drop-hover", handler);
};

/**
 * Listens for a file drop event.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenFileDropTauri = async <T>(handler: EventCallback<T>): Promise<UnlistenFn> => {
  return listen<T>("tauri://file-drop", handler);
};

/**
 * Listens for a file drop cancelled event.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenFileDropCancelledTauri = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  return listen<T>("tauri://file-drop-cancelled", handler);
};

/**
 * Listens for the start of a portfolio update.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenPortfolioUpdateStartTauri = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  return listen<T>("portfolio:update-start", handler);
};

/**
 * Listens for the completion of a portfolio update.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenPortfolioUpdateCompleteTauri = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  return listen<T>("portfolio:update-complete", handler);
};

/**
 * Listens for a database restored event.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenDatabaseRestoredTauri = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  return listen<T>("database-restored", handler);
};

/**
 * Listens for a portfolio update error.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export const listenPortfolioUpdateErrorTauri = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  return listen<T>("portfolio:update-error", handler);
};

/**
 * Listens for the completion of a market data sync.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export async function listenMarketSyncCompleteTauri<T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> {
  return listen("market:sync-complete", handler);
}

/**
 * Listens for the start of a market data sync.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export async function listenMarketSyncStartTauri<T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> {
  return listen("market:sync-start", handler);
}

/**
 * Listens for a navigation event to a specific route.
 *
 * @template T
 * @param {EventCallback<T>} handler The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten.
 */
export async function listenNavigateToRouteTauri<T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> {
  return listen("navigate-to-route", handler);
}

/**
 * Opens a file save dialog and saves the provided content.
 *
 * @param {string | Blob | Uint8Array} fileContent The content to save.
 * @param {string} fileName The default file name.
 * @returns {Promise<boolean>} A promise that resolves with `true` if the file was saved, or `false` if canceled.
 */
export const openFileSaveDialogTauri = async (
  fileContent: string | Blob | Uint8Array,
  fileName: string,
) => {
  const filePath = await save({
    defaultPath: fileName,
    filters: [
      {
        name: fileName,
        extensions: [fileName.split(".").pop() ?? ""],
      },
    ],
  });

  if (filePath === null) {
    return false;
  }

  let contentToSave: Uint8Array;
  if (typeof fileContent === "string") {
    contentToSave = new TextEncoder().encode(fileContent);
  } else if (fileContent instanceof Blob) {
    const arrayBuffer = await fileContent.arrayBuffer();
    contentToSave = new Uint8Array(arrayBuffer);
  } else {
    contentToSave = fileContent;
  }

  await writeFile(filePath, contentToSave, { baseDir: BaseDirectory.Document });

  return true;
};

/** A logger that uses the Tauri logging plugin. */
export const logger = {
  /** Logs an error message. */
  error,
  /** Logs an info message. */
  info,
  /** Logs a warning message. */
  warn,
  /** Logs a trace message. */
  trace,
  /** Logs a debug message. */
  debug,
};
