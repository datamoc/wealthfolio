import { ActivityImport, ImportMappingData } from "@/lib/types";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb } from "@/adapters";
import { logger } from "@/adapters";

/**
 * Imports a list of activities into an account.
 *
 * @param {object} params - The parameters for the import.
 * @param {ActivityImport[]} params.activities - The activities to import.
 * @returns {Promise<ActivityImport[]>} A promise that resolves with the imported activities, potentially with updated data.
 * @throws Will throw an error if the API call fails.
 */
export const importActivities = async ({
  activities,
}: {
  activities: ActivityImport[];
}): Promise<ActivityImport[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("import_activities", {
          accountId: activities[0].accountId,
          activities: activities,
        });
      case RUN_ENV.WEB:
        return invokeWeb("import_activities", {
          accountId: activities[0].accountId,
          activities,
        });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error checking activities import.");
    throw error;
  }
};

/**
 * Checks a list of activities for import, without actually importing them.
 * This is used to validate the data before the import is finalized.
 *
 * @param {object} params - The parameters for the check.
 * @param {string} params.account_id - The ID of the account to import into.
 * @param {ActivityImport[]} params.activities - The activities to check.
 * @returns {Promise<ActivityImport[]>} A promise that resolves with the checked activities, potentially with validation errors.
 * @throws Will throw an error if the API call fails.
 */
export const checkActivitiesImport = async ({
  account_id,
  activities,
}: {
  account_id: string;
  activities: ActivityImport[];
}): Promise<ActivityImport[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("check_activities_import", {
          accountId: account_id,
          activities: activities,
        });
      case RUN_ENV.WEB:
        return invokeWeb("check_activities_import", {
          accountId: account_id,
          activities,
        });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error checking activities import.");
    throw error;
  }
};

/**
 * Gets the import mapping for a specific account.
 *
 * @param {string} accountId - The ID of the account.
 * @returns {Promise<ImportMappingData>} A promise that resolves with the import mapping data.
 * @throws Will throw an error if the API call fails.
 */
export const getAccountImportMapping = async (accountId: string): Promise<ImportMappingData> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_account_import_mapping", { accountId });
      case RUN_ENV.WEB:
        return invokeWeb("get_account_import_mapping", { accountId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching mapping.");
    throw error;
  }
};

/**
 * Saves the import mapping for an account.
 *
 * @param {ImportMappingData} mapping - The import mapping data to save.
 * @returns {Promise<ImportMappingData>} A promise that resolves with the saved import mapping data.
 * @throws Will throw an error if the API call fails.
 */
export const saveAccountImportMapping = async (
  mapping: ImportMappingData,
): Promise<ImportMappingData> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("save_account_import_mapping", {
          mapping,
        });
      case RUN_ENV.WEB:
        return invokeWeb("save_account_import_mapping", { mapping });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error saving mapping.");
    throw error;
  }
};
