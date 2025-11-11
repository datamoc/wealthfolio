import { getRunEnv, invokeTauri, invokeWeb, logger, RUN_ENV } from "@/adapters";

/**
 * Information about a peer device in the sync network.
 */
export interface PeerInfo {
  /** The unique ID of the peer. */
  id: string;
  /** The name of the peer device. */
  name: string;
  /** The network address of the peer. */
  address: string;
  /** Whether this device is paired with the peer. */
  paired: boolean;
  /** The last time the peer was seen. */
  last_seen?: string;
  /** The last time a sync was completed with the peer. */
  last_sync?: string;
  /** A fingerprint for verifying the peer's identity. */
  fingerprint: string;
  /** The endpoints the peer is listening on. */
  listen_endpoints: string[];
}

/**
 * The overall status of the sync system.
 */
export interface SyncStatus {
  /** The unique ID of this device. */
  device_id: string;
  /** The name of this device. */
  device_name: string;
  /** Whether the sync server is running. */
  server_running: boolean;
  /** A list of known peers. */
  peers: PeerInfo[];
}

/**
 * Arguments for the `syncNow` command.
 */
export interface SyncNowArgs {
  /** The ID of the peer to sync with. */
  peer_id: string;
}

/**
 * Gets the current status of the sync system.
 *
 * @returns {Promise<SyncStatus>} A promise that resolves with the sync status.
 * @throws Will throw an error if the API call fails.
 */
export const getSyncStatus = async (): Promise<SyncStatus> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_sync_status");
      case RUN_ENV.WEB:
        return invokeWeb("get_sync_status");
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error fetching sync status.");
    throw error;
  }
};

/**
 * Generates a payload for pairing with another device.
 *
 * @returns {Promise<string>} A promise that resolves with the pairing payload.
 * @throws Will throw an error if the API call fails.
 */
export const generatePairingPayload = async (): Promise<string> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("generate_pairing_payload");
      case RUN_ENV.WEB:
        return invokeWeb("generate_pairing_payload");
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error generating pairing payload.");
    throw error;
  }
};

/**
 * Pairs with another device and initiates a sync.
 *
 * @param {string} payload - The pairing payload from the other device.
 * @returns {Promise<string>} A promise that resolves with a confirmation payload.
 * @throws Will throw an error if the API call fails.
 */
export const pairAndSync = async (payload: string): Promise<string> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("pair_and_sync", { payload });
      case RUN_ENV.WEB:
        return invokeWeb("pair_and_sync", { payload });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error pairing and syncing with peer.");
    throw error;
  }
};

/**
 * Forces a full sync with a peer device.
 *
 * @param {string} payload - The pairing payload of the peer device.
 * @returns {Promise<string>} A promise that resolves with a confirmation payload.
 * @throws Will throw an error if the API call fails.
 */
export const forceFullSyncWithPeer = async (payload: string): Promise<string> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("force_full_sync_with_peer", { payload });
      case RUN_ENV.WEB:
        return invokeWeb("force_full_sync_with_peer", { payload });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error performing full sync with peer.");
    throw error;
  }
};

/**
 * Initiates an immediate sync with a peer.
 *
 * @param {SyncNowArgs} args - The arguments for the sync.
 * @returns {Promise<void>} A promise that resolves when the sync is complete.
 * @throws Will throw an error if the API call fails.
 */
export const syncNow = async (args: SyncNowArgs): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("sync_now", { payload: args });
      case RUN_ENV.WEB:
        return invokeWeb("sync_now", { payload: args });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error syncing with peer.");
    throw error;
  }
};

/**
 * Initializes the sync system for a device that already has existing data.
 *
 * @returns {Promise<string>} A promise that resolves with a confirmation payload.
 * @throws Will throw an error if the API call fails.
 */
export const initializeSyncForExistingData = async (): Promise<string> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("initialize_sync_for_existing_data");
      case RUN_ENV.WEB:
        return invokeWeb("initialize_sync_for_existing_data");
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error initializing sync for existing data.");
    throw error;
  }
};

/**
 * Probes the local network to check for access to a specific host and port.
 *
 * @param {string} host - The host to probe.
 * @param {number} port - The port to probe.
 * @returns {Promise<void>} A promise that resolves if the probe is successful.
 * @throws Will throw an error if the probe fails.
 */
export const probeLocalNetworkAccess = async (host: string, port: number): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("probe_local_network_access", { host, port });
      case RUN_ENV.WEB:
        return invokeWeb("probe_local_network_access", { host, port });
      default:
        throw new Error("Unsupported environment");
    }
  } catch (error) {
    logger.error("Error probing local network access.");
    throw error;
  }
};
