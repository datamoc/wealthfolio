import type { EventCallback, UnlistenFn } from "@/adapters";
import {
  getRunEnv,
  RUN_ENV,
  listenFileDropCancelledTauri,
  listenFileDropHoverTauri,
  listenFileDropTauri,
  logger,
} from "@/adapters";

/**
 * Listens for a file drop hover event.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenImportFileDropHover = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenFileDropHoverTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen tauri://file-drop-hover.");
    throw error;
  }
};

/**
 * Listens for a file drop event.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenImportFileDrop = async <T>(handler: EventCallback<T>): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenFileDropTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen tauri://file-drop.");
    throw error;
  }
};

/**
 * Listens for a file drop cancelled event.
 * This is only supported in the desktop environment.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const listenImportFileDropCancelled = async <T>(
  handler: EventCallback<T>,
): Promise<UnlistenFn> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenFileDropCancelledTauri<T>(handler);
      case RUN_ENV.WEB:
        throw new Error(`Unsupported`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error listen tauri://file-drop-cancelled.");
    throw error;
  }
};

export type { UnlistenFn };
