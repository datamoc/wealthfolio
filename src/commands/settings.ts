import { getRunEnv, invokeTauri, invokeWeb, logger, RUN_ENV } from "@/adapters";
import { Settings } from "@/lib/types";

/**
 * Gets the application settings.
 *
 * @returns {Promise<Settings>} A promise that resolves with the settings object.
 */
export const getSettings = async (): Promise<Settings> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_settings");
      case RUN_ENV.WEB:
        return invokeWeb("get_settings");
      default:
        throw new Error(`Unsupported`);
    }
  } catch (_error) {
    logger.error("Error fetching settings.");
    return {} as Settings;
  }
};

/**
 * Updates the application settings.
 *
 * @param {Partial<Settings>} settingsUpdate - An object containing the settings to update.
 * @returns {Promise<Settings>} A promise that resolves with the updated settings object.
 * @throws Will throw an error if the API call fails.
 */
export const updateSettings = async (settingsUpdate: Partial<Settings>): Promise<Settings> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_settings", { settingsUpdate });
      case RUN_ENV.WEB:
        return invokeWeb("update_settings", { settingsUpdate });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating settings.");
    throw error;
  }
};

/**
 * Checks if the auto-update check is enabled.
 *
 * @returns {Promise<boolean>} A promise that resolves with `true` if auto-update is enabled, `false` otherwise.
 */
export const isAutoUpdateCheckEnabled = async (): Promise<boolean> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("is_auto_update_check_enabled");
      case RUN_ENV.WEB:
        return invokeWeb("is_auto_update_check_enabled");
      default:
        throw new Error(`Unsupported`);
    }
  } catch (_error) {
    logger.error("Error checking auto-update setting.");
    return true; // Default to enabled
  }
};

/**
 * Backs up the application database.
 *
 * @returns {Promise<{ filename: string; data: Uint8Array }>} A promise that resolves with the backup filename and data.
 * @throws Will throw an error if the API call fails.
 */
export const backupDatabase = async (): Promise<{ filename: string; data: Uint8Array }> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP: {
        const result = await invokeTauri<[string, number[]]>("backup_database");
        const [filename, data] = result;
        return { filename, data: new Uint8Array(data) };
      }
      case RUN_ENV.WEB:
        return invokeWeb("backup_database");
      default:
        throw new Error(`Unsupported environment for database backup`);
    }
  } catch (error) {
    logger.error("Error backing up database.");
    throw error;
  }
};

/**
 * Backs up the application database to a specific path.
 *
 * @param {string} backupDir - The directory to save the backup to.
 * @returns {Promise<string>} A promise that resolves with the path to the backup file.
 * @throws Will throw an error if the API call fails.
 */
export const backupDatabaseToPath = async (backupDir: string): Promise<string> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return await invokeTauri<string>("backup_database_to_path", { backupDir });
      case RUN_ENV.WEB:
        return invokeWeb("backup_database_to_path", { backupDir });
      default:
        throw new Error(`Unsupported environment for database backup`);
    }
  } catch (error) {
    logger.error("Error backing up database to path.");
    throw error;
  }
};

/**
 * Restores the application database from a backup file.
 *
 * @param {string} backupFilePath - The path to the backup file.
 * @returns {Promise<void>} A promise that resolves when the database is restored.
 * @throws Will throw an error if the API call fails.
 */
export const restoreDatabase = async (backupFilePath: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        await invokeTauri("restore_database", { backupFilePath });
        break;
      case RUN_ENV.WEB:
        await invokeWeb("restore_database", { backupFilePath });
        break;
      default:
        throw new Error(`Unsupported environment for database restore`);
    }
  } catch (error) {
    logger.error("Error restoring database.");
    throw error;
  }
};
