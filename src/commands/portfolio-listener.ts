import type { EventCallback, UnlistenFn } from "@/adapters";
import {
  getRunEnv,
  RUN_ENV,
  listenPortfolioUpdateStartTauri,
  listenPortfolioUpdateCompleteTauri,
  listenPortfolioUpdateErrorTauri,
  logger,
  listenMarketSyncCompleteTauri,
  listenMarketSyncStartTauri,
} from "@/adapters";

/**
 * Listens for the start of a portfolio update.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenPortfolioUpdateStart = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenPortfolioUpdateStartTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen portfolio:update-start.");
    throw error;
  }
};

/**
 * Listens for the completion of a portfolio update.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenPortfolioUpdateComplete = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenPortfolioUpdateCompleteTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen portfolio:update-complete.");
    throw error;
  }
};

/**
 * Listens for an error during a portfolio update.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenPortfolioUpdateError = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenPortfolioUpdateErrorTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen portfolio:update-error.");
    throw error;
  }
};

/**
 * Listens for the start of a market data sync.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenMarketSyncStart = async <T>(handler: EventCallback<T>): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenMarketSyncStartTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen market:sync-start.");
    throw error;
  }
};

/**
 * Listens for the completion of a market data sync.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenMarketSyncComplete = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenMarketSyncCompleteTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen market:sync-complete.");
    throw error;
  }
};
