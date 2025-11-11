import z from "zod";
import { Account } from "@/lib/types";
import { newAccountSchema } from "@/lib/schemas";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb } from "@/adapters";
import { logger } from "@/adapters";

type NewAccount = z.infer<typeof newAccountSchema>;

/**
 * Fetches all accounts from the backend.
 *
 * This function determines the runtime environment and calls the appropriate
 * adapter (`invokeTauri` for desktop, `invokeWeb` for web) to get the accounts.
 *
 * @returns {Promise<Account[]>} A promise that resolves with an array of accounts.
 * @throws Will throw an error if the API call fails.
 */
export const getAccounts = async (): Promise<Account[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_accounts");
      case RUN_ENV.WEB:
        return invokeWeb("get_accounts");
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching accounts.");
    throw error;
  }
};

/**
 * Creates a new account.
 *
 * @param {NewAccount} account The account data to create.
 * @returns {Promise<Account>} A promise that resolves with the newly created account.
 * @throws Will throw an error if the API call fails.
 */
export const createAccount = async (account: NewAccount): Promise<Account> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("create_account", { account: account });
      case RUN_ENV.WEB:
        return invokeWeb("create_account", { account });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error creating account.");
    throw error;
  }
};

/**
 * Updates an existing account.
 *
 * @param {NewAccount} account The account data to update.
 * @returns {Promise<Account>} A promise that resolves with the updated account.
 * @throws Will throw an error if the API call fails.
 */
export const updateAccount = async (account: NewAccount): Promise<Account> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP: {
        const { currency: _currency, ...updatedAccountData } = account;
        return invokeTauri("update_account", { accountUpdate: updatedAccountData });
      }
      case RUN_ENV.WEB:
        return invokeWeb("update_account", { accountUpdate: account });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating account.");
    throw error;
  }
};

/**
 * Deletes an account.
 *
 * @param {string} accountId The ID of the account to delete.
 * @returns {Promise<void>} A promise that resolves when the account is deleted.
 * @throws Will throw an error if the API call fails.
 */
export const deleteAccount = async (accountId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        await invokeTauri("delete_account", { accountId });
        return;
      case RUN_ENV.WEB:
        await invokeWeb("delete_account", { accountId });
        return;
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting account.");
    throw error;
  }
};
