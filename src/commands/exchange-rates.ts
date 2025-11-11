import type { ExchangeRate } from "@/lib/types";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

/**
 * Gets the latest exchange rates.
 *
 * @returns {Promise<ExchangeRate[]>} A promise that resolves with a list of exchange rates.
 * @throws Will throw an error if the API call fails.
 */
export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_latest_exchange_rates");
      case RUN_ENV.WEB:
        return invokeWeb("get_latest_exchange_rates");
      default:
        throw new Error("Unsupported environment");
    }
  } catch (_error) {
    logger.error("Error fetching exchange rates.");
    return [];
  }
};

/**
 * Updates an existing exchange rate.
 *
 * @param {ExchangeRate} updatedRate - The updated exchange rate data.
 * @returns {Promise<ExchangeRate>} A promise that resolves with the updated exchange rate.
 * @throws Will throw an error if the API call fails.
 */
export const updateExchangeRate = async (updatedRate: ExchangeRate): Promise<ExchangeRate> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_exchange_rate", { rate: updatedRate });
      case RUN_ENV.WEB:
        return invokeWeb("update_exchange_rate", { rate: updatedRate });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error updating exchange rate.");
    throw error;
  }
};

/**
 * Adds a new exchange rate.
 *
 * @param {Omit<ExchangeRate, "id">} newRate - The new exchange rate data.
 * @returns {Promise<ExchangeRate>} A promise that resolves with the newly created exchange rate.
 * @throws Will throw an error if the API call fails.
 */
export const addExchangeRate = async (newRate: Omit<ExchangeRate, "id">): Promise<ExchangeRate> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("add_exchange_rate", { newRate });
      case RUN_ENV.WEB:
        return invokeWeb("add_exchange_rate", { newRate });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error adding exchange rate.");
    throw error;
  }
};

/**
 * Deletes an exchange rate.
 *
 * @param {string} rateId - The ID of the exchange rate to delete.
 * @returns {Promise<void>} A promise that resolves when the exchange rate is deleted.
 * @throws Will throw an error if the API call fails.
 */
export const deleteExchangeRate = async (rateId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("delete_exchange_rate", { rateId });
      case RUN_ENV.WEB:
        return invokeWeb("delete_exchange_rate", { rateId });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error deleting exchange rate.");
    throw error;
  }
};
