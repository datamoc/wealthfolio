import type { EventCallback, UnlistenFn } from "@/adapters";
import { listenNavigateToRouteTauri, getRunEnv, RUN_ENV, logger } from "@/adapters";

/**
 * Listens for a 'navigate-to-route' event from the backend.
 * This is primarily used in the desktop environment to allow the backend to
 * trigger frontend navigation. In a web environment, this function is a no-op.
 *
 * @template T
 * @param {EventCallback<T>} handler - The event handler to call when the event is received.
 * @returns {Promise<UnlistenFn>} A promise that resolves with a function to unlisten to the event.
 */
export async function listenNavigateToRoute<T>(handler: EventCallback<T>): Promise<UnlistenFn> {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return listenNavigateToRouteTauri<T>(handler);
      case RUN_ENV.WEB:
        return () => {
          return;
        };
      default:
        return () => {
          return;
        };
    }
  } catch (_error) {
    logger.error("Error listen navigate-to-route event.");
    return () => {
      return;
    };
  }
}
