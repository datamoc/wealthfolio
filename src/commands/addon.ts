import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";
import type { InstalledAddon, ExtractedAddon } from "@/adapters/tauri";
import type { AddonManifest, AddonUpdateCheckResult } from "@wealthfolio/addon-sdk";
import type { AddonStoreListing } from "@/lib/types";

/**
 * Gets a list of all installed addons.
 *
 * @returns {Promise<InstalledAddon[]>} A promise that resolves with a list of installed addons.
 * @throws Will throw an error if the API call fails.
 */
export const getInstalledAddons = async (): Promise<InstalledAddon[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("list_installed_addons");
      case RUN_ENV.WEB:
        return invokeWeb("list_installed_addons");
      default:
        throw new Error("Addon management is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error listing installed addons.");
    throw error;
  }
};

/**
 * Loads an addon for the runtime.
 *
 * @param {string} addonId - The ID of the addon to load.
 * @returns {Promise<ExtractedAddon>} A promise that resolves with the extracted addon data.
 * @throws Will throw an error if the API call fails.
 */
export const loadAddon = async (addonId: string): Promise<ExtractedAddon> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("load_addon_for_runtime", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("load_addon_for_runtime", { addonId });
      default:
        throw new Error("Addon loading is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error loading addon for runtime.");
    throw error;
  }
};

/**
 * Extracts the contents of an addon ZIP file.
 *
 * @param {Uint8Array} zipData - The binary data of the ZIP file.
 * @returns {Promise<ExtractedAddon>} A promise that resolves with the extracted addon data.
 * @throws Will throw an error if the API call fails.
 */
export const extractAddon = async (zipData: Uint8Array): Promise<ExtractedAddon> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("extract_addon_zip", { zipData: Array.from(zipData) });
      case RUN_ENV.WEB:
        return invokeWeb("extract_addon_zip", { zipData: Array.from(zipData) });
      default:
        throw new Error("Addon extraction is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error extracting addon ZIP.");
    throw error;
  }
};

/**
 * Installs an addon from a ZIP file.
 *
 * @param {Uint8Array} zipData - The binary data of the ZIP file.
 * @param {boolean} [enableAfterInstall] - Whether to enable the addon after installation.
 * @returns {Promise<AddonManifest>} A promise that resolves with the manifest of the installed addon.
 * @throws Will throw an error if the API call fails.
 */
export const installAddon = async (
  zipData: Uint8Array,
  enableAfterInstall?: boolean,
): Promise<AddonManifest> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("install_addon_zip", {
          zipData: Array.from(zipData),
          enableAfterInstall,
        });
      case RUN_ENV.WEB:
        return invokeWeb("install_addon_zip", {
          zipData: Array.from(zipData),
          enableAfterInstall,
        });
      default:
        throw new Error("Addon installation is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error installing addon ZIP.");
    throw error;
  }
};

/**
 * Toggles the enabled state of an addon.
 *
 * @param {string} addonId - The ID of the addon to toggle.
 * @param {boolean} enabled - The desired enabled state.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws Will throw an error if the API call fails.
 */
export const toggleAddon = async (addonId: string, enabled: boolean): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("toggle_addon", { addonId, enabled });
      case RUN_ENV.WEB:
        return invokeWeb("toggle_addon", { addonId, enabled });
      default:
        throw new Error("Addon toggle is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error toggling addon.");
    throw error;
  }
};

/**
 * Uninstalls an addon.
 *
 * @param {string} addonId - The ID of the addon to uninstall.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws Will throw an error if the API call fails.
 */
export const uninstallAddon = async (addonId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("uninstall_addon", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("uninstall_addon", { addonId });
      default:
        throw new Error("Addon uninstallation is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error uninstalling addon.");
    throw error;
  }
};

/**
 * Gets a list of all enabled addons.
 *
 * @returns {Promise<ExtractedAddon[]>} A promise that resolves with a list of enabled addons.
 * @throws Will throw an error if the API call fails.
 */
export const getEnabledAddons = async (): Promise<ExtractedAddon[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_enabled_addons_on_startup");
      case RUN_ENV.WEB:
        return invokeWeb("get_enabled_addons_on_startup");
      default:
        throw new Error("Addon startup loading is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error getting enabled addons on startup.");
    throw error;
  }
};

/**
 * Checks for updates for a specific addon.
 *
 * @param {string} addonId - The ID of the addon to check.
 * @returns {Promise<AddonUpdateCheckResult>} A promise that resolves with the update check result.
 * @throws Will throw an error if the API call fails.
 */
export const checkAddonUpdate = async (addonId: string): Promise<AddonUpdateCheckResult> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("check_addon_update", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("check_addon_update", { addonId });
      default:
        throw new Error("Addon update checking is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error checking addon update.");
    throw error;
  }
};

/**
 * Checks for updates for all installed addons.
 *
 * @returns {Promise<AddonUpdateCheckResult[]>} A promise that resolves with a list of update check results.
 * @throws Will throw an error if the API call fails.
 */
export const checkAllAddonUpdates = async (): Promise<AddonUpdateCheckResult[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("check_all_addon_updates");
      case RUN_ENV.WEB:
        return invokeWeb("check_all_addon_updates");
      default:
        throw new Error("Addon update checking is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error checking all addon updates.");
    throw error;
  }
};

/**
 * Updates an addon from the addon store.
 *
 * @param {string} addonId - The ID of the addon to update.
 * @returns {Promise<AddonManifest>} A promise that resolves with the manifest of the updated addon.
 * @throws Will throw an error if the API call fails.
 */
export const updateAddon = async (addonId: string): Promise<AddonManifest> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_addon_from_store_by_id", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("update_addon_from_store_by_id", { addonId });
      default:
        throw new Error("Addon updating is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error updating addon from store by ID.");
    throw error;
  }
};

/**
 * Downloads an addon to a staging area for review before installation.
 *
 * @param {string} addonId - The ID of the addon to download.
 * @returns {Promise<ExtractedAddon>} A promise that resolves with the extracted addon data.
 * @throws Will throw an error if the API call fails.
 */
export const downloadAddonForReview = async (addonId: string): Promise<ExtractedAddon> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("download_addon_to_staging", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("download_addon_to_staging", { addonId });
      default:
        throw new Error("Addon staging is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error downloading addon to staging.");
    throw error;
  }
};

/**
 * Installs an addon from the staging area.
 *
 * @param {string} addonId - The ID of the addon to install.
 * @param {boolean} [enableAfterInstall] - Whether to enable the addon after installation.
 * @returns {Promise<AddonManifest>} A promise that resolves with the manifest of the installed addon.
 * @throws Will throw an error if the API call fails.
 */
export const installFromStaging = async (
  addonId: string,
  enableAfterInstall?: boolean,
): Promise<AddonManifest> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("install_addon_from_staging", {
          addonId,
          enableAfterInstall,
        });
      case RUN_ENV.WEB:
        return invokeWeb("install_addon_from_staging", {
          addonId,
          enableAfterInstall,
        });
      default:
        throw new Error("Addon installation from staging is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error installing addon from staging.");
    throw error;
  }
};

/**
 * Clears the addon staging area.
 *
 * @param {string} [addonId] - If provided, only the staging data for this addon will be cleared. Otherwise, the entire staging area is cleared.
 * @returns {Promise<void>} A promise that resolves when the staging area is cleared.
 * @throws Will throw an error if the API call fails.
 */
export const clearAddonStaging = async (addonId?: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("clear_addon_staging", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("clear_addon_staging", { addonId });
      default:
        throw new Error("Addon staging cleanup is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error clearing addon staging.");
    throw error;
  }
};

/**
 * Gets the ratings for a specific addon.
 *
 * @param {string} addonId - The ID of the addon.
 * @returns {Promise<unknown[]>} A promise that resolves with a list of ratings.
 * @throws Will throw an error if the API call fails.
 */
export const getAddonRatings = async (addonId: string): Promise<unknown[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_addon_ratings", { addonId });
      case RUN_ENV.WEB:
        return invokeWeb("get_addon_ratings", { addonId });
      default:
        throw new Error("Addon ratings are only supported on desktop");
    }
  } catch (error) {
    logger.error("Error getting addon ratings.");
    throw error;
  }
};

/**
 * Submits a rating and review for an addon.
 *
 * @param {string} addonId - The ID of the addon.
 * @param {number} rating - The rating, from 1 to 5.
 * @param {string} [review] - An optional review text.
 * @returns {Promise<unknown>} A promise that resolves when the rating is submitted.
 * @throws Will throw an error if the rating is invalid or the API call fails.
 */
export const submitAddonRating = async (
  addonId: string,
  rating: number,
  review?: string,
): Promise<unknown> => {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("submit_addon_rating", {
          addonId,
          rating,
          review,
        });
      case RUN_ENV.WEB:
        return invokeWeb("submit_addon_rating", {
          addonId,
          rating,
          review,
        });
      default:
        throw new Error("Addon rating submission is only supported on desktop");
    }
  } catch (error) {
    logger.error("Error submitting addon rating.");
    throw error;
  }
};

/**
 * Fetches the listings from the addon store.
 *
 * @returns {Promise<AddonStoreListing[]>} A promise that resolves with a list of addon store listings.
 * @throws Will throw an error if the API call fails.
 */
export const fetchAddonStoreListings = async (): Promise<AddonStoreListing[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("fetch_addon_store_listings");
      case RUN_ENV.WEB:
        return invokeWeb("fetch_addon_store_listings");
      default:
        throw new Error("Addon store is only supported on desktop/web");
    }
  } catch (error) {
    logger.error("Error fetching addon store listings.");
    throw error;
  }
};

/**
 * Gets addon-specific data from database storage.
 *
 * @param {string} addonId - The ID of the addon.
 * @param {string} key - The data key.
 * @returns {Promise<string>} A promise that resolves with the stored data value.
 * @throws Will throw an error if the API call fails.
 */
export const getAddonData = async (addonId: string, key: string): Promise<string> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_addon_data", { addonId, key });
      case RUN_ENV.WEB:
        return invokeWeb("get_addon_data", { addonId, key });
      default:
        throw new Error("Addon storage is only supported on desktop/web");
    }
  } catch (error) {
    logger.error("Error getting addon data.");
    throw error;
  }
};

/**
 * Sets addon-specific data in database storage.
 *
 * @param {string} addonId - The ID of the addon.
 * @param {string} key - The data key.
 * @param {string} value - The data value to store.
 * @returns {Promise<void>} A promise that resolves when the data is set.
 * @throws Will throw an error if the API call fails.
 */
export const setAddonData = async (addonId: string, key: string, value: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("set_addon_data", { addonId, key, value });
      case RUN_ENV.WEB:
        return invokeWeb("set_addon_data", { addonId, key, value });
      default:
        throw new Error("Addon storage is only supported on desktop/web");
    }
  } catch (error) {
    logger.error("Error setting addon data.");
    throw error;
  }
};
