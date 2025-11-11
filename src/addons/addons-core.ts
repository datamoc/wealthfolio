import { logger } from "@/adapters";
import {
  createAddonContext,
  getDynamicNavItems,
  getDynamicRoutes,
  triggerAllDisableCallbacks,
} from "@/addons/addons-runtime-context";
import { getInstalledAddons, loadAddon as loadAddonRuntime } from "@/commands/addon";
import type { AddonContext, AddonManifest } from "@wealthfolio/addon-sdk";
import { ReactVersion } from "@wealthfolio/addon-sdk";

interface AddonFile {
  path: string;
  manifestPath: string;
  manifest: AddonManifest;
}

// Store loaded addons for cleanup
const loadedAddons = new Map<string, { disable?: () => void }>();
const loadedAddonIds = new Set<string>(); // Prevent re-loading already processed addons

/**
 * Discovers all available addons by calling the `getInstalledAddons` command.
 * It constructs the necessary file paths for each addon's main file and manifest.
 *
 * @returns {Promise<AddonFile[]>} A promise that resolves with a list of discovered addon files.
 */
async function discoverAddons(): Promise<AddonFile[]> {
  try {
    const installedAddons = await getInstalledAddons();
    const addonFiles: AddonFile[] = [];

    for (const addon of installedAddons) {
      // Create AddonFile structure from InstalledAddon
      // Note: filePath from Tauri represents the addon directory, not the specific file
      addonFiles.push({
        path: `${addon.filePath}/${addon.metadata.main}`, // Construct the main file path
        manifestPath: `${addon.filePath}/manifest.json`, // Construct manifest path
        manifest: addon.metadata,
      });
    }

    return addonFiles;
  } catch (error) {
    logger.error(`Failed to discover addons: ${String(error)}`);
    return [];
  }
}

/**
 * Validates if an addon is compatible with the current SDK version.
 * Currently, it warns on a mismatch but allows the addon to load.
 *
 * @param {AddonManifest} manifest The manifest of the addon to validate.
 * @returns {boolean} `true` if the addon is considered compatible, `false` otherwise.
 */
function validateAddonCompatibility(manifest: AddonManifest): boolean {
  // Be lenient in web mode: warn on mismatch but allow load.
  // Future: implement proper semver compatibility if needed.
  if (manifest.sdkVersion && manifest.sdkVersion !== "1.0.0") {
    logger.warn(
      `Addon ${manifest.id} declares SDK ${manifest.sdkVersion}; host is 1.0.0. Proceeding with caution.`,
    );
  }
  return true;
}

/**
 * Loads a single addon.
 *
 * This function performs several steps:
 * 1. Checks if the addon has already been loaded to prevent duplicates.
 * 2. Validates the addon's compatibility with the current SDK version.
 * 3. Loads the addon's code using the `loadAddonRuntime` command.
 * 4. Extracts permissions and other metadata from the addon's manifest.
 * 5. Verifies the availability of required global objects like `React` and `ReactDOM`.
 * 6. Creates a blob URL from the addon's code and dynamically imports it.
 * 7. Resolves the addon's `enable` function from its exports.
 * 8. Creates an addon-specific context and calls the `enable` function.
 * 9. Stores a reference to the addon for potential cleanup.
 *
 * @param {AddonFile} addonFile The addon file to load.
 * @param {AddonContext} _context The addon context (currently unused).
 * @returns {Promise<boolean>} A promise that resolves with `true` if the addon was loaded successfully, or `false` otherwise.
 */
async function loadAddon(addonFile: AddonFile, _context: AddonContext): Promise<boolean> {
  let blobUrl: string | null = null;
  try {
    // Check if this addon ID has already been loaded in the current session
    if (loadedAddonIds.has(addonFile.manifest.id)) {
      logger.warn(
        `Addon "${addonFile.manifest.name}" (ID: ${addonFile.manifest.id}) already loaded in this session. Skipping duplicate load.`,
      );
      // Optionally, you might want to return true if already loaded implies success for the caller
      return true;
    }

    // Validate compatibility
    if (!validateAddonCompatibility(addonFile.manifest)) {
      logger.error(`Addon ${addonFile.manifest.id} is not compatible`);
      return false;
    }

    // Load addon using Tauri command instead of direct file access
    // Load addon for runtime execution using Tauri command
    const extractedAddon = await loadAddonRuntime(addonFile.manifest.id);

    // Find the main file from the extracted addon files
    const mainFile = extractedAddon.files.find((file) => file.isMain);
    if (!mainFile) {
      logger.error(
        `Main file not found for addon ${addonFile.manifest.id}. Available files: ${extractedAddon.files.map((f) => f.name).join(", ")}`,
      );
      return false;
    }

    const addonCode = mainFile.content;

    // Extract permission data directly from manifest (already processed by Rust backend)
    const permissions = extractedAddon.metadata.permissions ?? [];
    const detectedFunctions = permissions.flatMap((p) =>
      p.functions.filter((f) => f.isDetected).map((f) => f.name),
    );
    const detectedCategories = [...new Set(permissions.map((p) => p.category))];

    logger.info(
      `Permissions for addon ${extractedAddon.metadata.id}: functions=[${detectedFunctions.join(",")}], categories=[${detectedCategories.join(",")}]`,
    );

    // Runtime guards: Verify React singletons are available before addon execution
    const g = globalThis as unknown as {
      React?: { version?: string };
      ReactDOM?: { createPortal?: unknown };
    };
    if (g.React?.version && g.React.version !== ReactVersion) {
      logger.warn(`⚠️ React version mismatch: host=${g.React.version} sdk=${ReactVersion}`);
    }

    if (typeof g.ReactDOM?.createPortal !== "function") {
      throw new Error(
        "Host did not expose ReactDOM.createPortal. Portal-based UI components will not work.",
      );
    }

    // Create a Blob and an object URL
    const blob = new Blob([addonCode], { type: "text/javascript" });
    blobUrl = URL.createObjectURL(blob);

    // Dynamic import using the Blob URL
    // The /* @vite-ignore */ comment might not be strictly necessary for blob URLs
    // but can be kept if vite shows warnings during build.
    const mod = await import(/* @vite-ignore */ blobUrl);

    // Robustly resolve the addon's enable() regardless of bundle style
    type EnableFn = ((ctx: AddonContext) => unknown) | null;
    const asRecord = mod as unknown as Record<string, unknown> & {
      default?: unknown;
    };
    const defaultObj = asRecord.default as
      | ((ctx: AddonContext) => unknown)
      | { enable?: (ctx: AddonContext) => unknown }
      | undefined;
    const enableFunction: EnableFn =
      (typeof defaultObj === "function" ? defaultObj : null) ??
      (defaultObj &&
      typeof (defaultObj as { enable?: (ctx: AddonContext) => unknown }).enable === "function"
        ? (defaultObj as { enable: (ctx: AddonContext) => unknown }).enable
        : null) ??
      (typeof asRecord.enable === "function"
        ? (asRecord.enable as (ctx: AddonContext) => unknown)
        : null) ??
      (typeof (asRecord as Record<string, unknown>).PortfolioTrackerAddon === "function"
        ? (asRecord as { PortfolioTrackerAddon: (ctx: AddonContext) => unknown })
            .PortfolioTrackerAddon
        : null) ??
      (typeof (mod as unknown) === "function"
        ? (mod as unknown as (ctx: AddonContext) => unknown)
        : null);

    if (!enableFunction) {
      logger.error(
        `❌ Addon ${extractedAddon.metadata.id} does not export a valid enable function. Available exports: ${Object.keys(mod).join(", ")}`,
      );
      return false;
    }

    // Create addon-specific context with scoped secrets
    const addonSpecificContext = createAddonContext(extractedAddon.metadata.id);
    const result = await enableFunction(addonSpecificContext);

    // Store addon reference for potential cleanup
    const typedResult = result as { disable?: () => void } | undefined;
    loadedAddons.set(extractedAddon.metadata.id, {
      disable: typeof typedResult?.disable === "function" ? typedResult.disable : undefined,
    });
    loadedAddonIds.add(extractedAddon.metadata.id); // Add to set after successful load and enablement

    return true;
  } catch (error) {
    logger.error(`Failed to load addon ${addonFile.manifest.id}: ${String(error)}`);
    return false;
  } finally {
    // Clean up the Blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}

/**
 * Loads all installed and enabled addons.
 *
 * It discovers all addons, filters for the enabled ones, and then loads them
 * concurrently. It logs the number of successfully loaded addons.
 */
export async function loadInstalledAddons(): Promise<void> {
  const addonFiles = await discoverAddons();

  if (addonFiles.length === 0) {
    logger.info("⚠️  No addons found to load - check AppData/addons directory");
    return;
  }

  // Filter only enabled addons
  const enabledAddonFiles = addonFiles.filter((addonFile) => addonFile.manifest.enabled !== false);

  if (enabledAddonFiles.length === 0) {
    logger.info("📦 No enabled addons found to load");
    return;
  }

  let loadedCount = 0;
  const loadPromises = enabledAddonFiles.map(async (addonFile) => {
    // Each addon gets its own context, but loadAddon creates its own internally
    const success = await loadAddon(addonFile, {} as AddonContext);
    if (success) {
      loadedCount++;
    } else {
      void 0;
    }
  });

  // Load all enabled addons concurrently
  await Promise.all(loadPromises);

  logger.info(
    `🎉 Successfully loaded ${loadedCount} out of ${enabledAddonFiles.length} enabled addons`,
  );

  // Debug: Show current navigation state
}

/**
 * Unloads a specific addon by its ID.
 *
 * If the addon has a `disable` function, it will be called. The addon is then
 * removed from the list of loaded addons.
 *
 * @param {string} addonId The ID of the addon to unload.
 */
export function unloadAddon(addonId: string): void {
  const addon = loadedAddons.get(addonId);
  if (addon) {
    try {
      if (addon.disable) {
        addon.disable();
      }
      loadedAddons.delete(addonId);
      loadedAddonIds.delete(addonId);
      logger.info(`🗑️ Unloaded addon: ${addonId}`);
    } catch (error) {
      logger.error(`Error unloading addon ${addonId}: ${String(error)}`);
    }
  }
}

/**
 * Unloads all currently loaded addons and cleans up their resources.
 *
 * This function iterates through all loaded addons, calls their `disable`
 * function if it exists, and clears all addon-related data structures. It also
 * triggers the disable callbacks for all dynamic routes and navigation items.
 */
export function unloadAllAddons(): void {
  loadedAddons.forEach((addon, id) => {
    try {
      if (addon.disable) {
        addon.disable();
      }
    } catch (error) {
      logger.error(`Error unloading addon ${id}: ${String(error)}`);
    }
  });

  loadedAddons.clear();
  loadedAddonIds.clear(); // Clear the set when unloading all

  // Clear navigation items and routes from runtime context
  triggerAllDisableCallbacks();
}

/**
 * Gets a list of the IDs of all currently loaded addons.
 *
 * @returns {string[]} An array of loaded addon IDs.
 */
export function getLoadedAddons(): string[] {
  return Array.from(loadedAddons.keys());
}

/**
 * Logs the current state of the addon system for debugging purposes.
 * This includes dynamic navigation items, dynamic routes, and the list of loaded addons.
 */
export function debugAddonState(): void {
  logger.info("🐛 Addon Debug Info:");
  logger.info(`- Dynamic nav items: ${JSON.stringify(getDynamicNavItems())}`);
  logger.info(`- Dynamic routes: ${JSON.stringify(getDynamicRoutes())}`);
  logger.info(`- Loaded addons: ${JSON.stringify(getLoadedAddons())}`);
}

/**
 * Reloads all addons.
 *
 * This is useful for development and after changing addon settings. It first unloads
 * all addons and then dynamically imports and calls the `loadAllAddons` function.
 */
export async function reloadAllAddons(): Promise<void> {
  unloadAllAddons();

  // Dynamically import the full plugin loader to avoid importing dev mode
  const { loadAllAddons } = await import("./addons-loader");
  await loadAllAddons();
}
