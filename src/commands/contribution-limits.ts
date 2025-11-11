import { ContributionLimit, NewContributionLimit, DepositsCalculation } from "@/lib/types";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

/**
 * Gets all contribution limits.
 *
 * @returns {Promise<ContributionLimit[]>} A promise that resolves with a list of contribution limits.
 * @throws Will throw an error if the API call fails.
 */
export const getContributionLimit = async (): Promise<ContributionLimit[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_contribution_limits");
      case RUN_ENV.WEB:
        return invokeWeb("get_contribution_limits");
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching contribution limits.");
    throw error;
  }
};

/**
 * Creates a new contribution limit.
 *
 * @param {NewContributionLimit} newLimit - The data for the new contribution limit.
 * @returns {Promise<ContributionLimit>} A promise that resolves with the newly created contribution limit.
 * @throws Will throw an error if the API call fails.
 */
export const createContributionLimit = async (
  newLimit: NewContributionLimit,
): Promise<ContributionLimit> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("create_contribution_limit", { newLimit });
      case RUN_ENV.WEB:
        return invokeWeb("create_contribution_limit", { newLimit });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error creating contribution limit.");
    throw error;
  }
};

/**
 * Updates an existing contribution limit.
 *
 * @param {string} id - The ID of the contribution limit to update.
 * @param {NewContributionLimit} updatedLimit - The updated data for the contribution limit.
 * @returns {Promise<ContributionLimit>} A promise that resolves with the updated contribution limit.
 * @throws Will throw an error if the API call fails.
 */
export const updateContributionLimit = async (
  id: string,
  updatedLimit: NewContributionLimit,
): Promise<ContributionLimit> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_contribution_limit", { id, updatedLimit });
      case RUN_ENV.WEB:
        return invokeWeb("update_contribution_limit", { id, updatedLimit });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating contribution limit.");
    throw error;
  }
};

/**
 * Deletes a contribution limit.
 *
 * @param {string} id - The ID of the contribution limit to delete.
 * @returns {Promise<void>} A promise that resolves when the contribution limit is deleted.
 * @throws Will throw an error if the API call fails.
 */
export const deleteContributionLimit = async (id: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("delete_contribution_limit", { id });
      case RUN_ENV.WEB:
        return invokeWeb("delete_contribution_limit", { id });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting contribution limit.");
    throw error;
  }
};

/**
 * Calculates the total deposits for a given contribution limit.
 *
 * @param {string} limitId - The ID of the contribution limit.
 * @returns {Promise<DepositsCalculation>} A promise that resolves with the deposit calculation.
 * @throws Will throw an error if the API call fails.
 */
export const calculateDepositsForLimit = async (limitId: string): Promise<DepositsCalculation> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("calculate_deposits_for_contribution_limit", { limitId });
      case RUN_ENV.WEB:
        return invokeWeb("calculate_deposits_for_contribution_limit", { limitId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error calculating deposits for contribution limit.");
    throw error;
  }
};
