import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

/**
 * Sets a secret for a given provider.
 *
 * @param {string} providerId - The ID of the provider.
 * @param {string} secret - The secret to set.
 * @returns {Promise<void>} A promise that resolves when the secret is set.
 * @throws Will throw an error if the API call fails.
 */
export const setSecret = async (providerId: string, secret: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("set_secret", { providerId, secret });
      case RUN_ENV.WEB:
        return invokeWeb("set_secret", { providerId, secret });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error setting secret.");
    throw error;
  }
};

/**
 * Gets a secret for a given provider.
 *
 * @param {string} providerId - The ID of the provider.
 * @returns {Promise<string | null>} A promise that resolves with the secret, or null if not found.
 * @throws Will throw an error if the API call fails.
 */
export const getSecret = async (providerId: string): Promise<string | null> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_secret", { providerId });
      case RUN_ENV.WEB:
        return invokeWeb("get_secret", { providerId });
      default:
        return null;
    }
  } catch (error) {
    logger.error("Error getting secret.");
    throw error;
  }
};

/**
 * Deletes a secret for a given provider.
 *
 * @param {string} providerId - The ID of the provider.
 * @returns {Promise<void>} A promise that resolves when the secret is deleted.
 * @throws Will throw an error if the API call fails.
 */
export const deleteSecret = async (providerId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("delete_secret", { providerId });
      case RUN_ENV.WEB:
        return invokeWeb("delete_secret", { providerId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting secret.");
    throw error;
  }
};
