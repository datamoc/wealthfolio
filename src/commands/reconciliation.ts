import {
  ReconciliationSession,
  ReconciliationItem,
  ReconciliationDiscrepancy,
  ReconciliationSummary,
  CreateReconciliationSessionRequest,
  AddReconciliationItemRequest,
} from "@/lib/types";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

// ============================================================================
// Session Operations
// ============================================================================

export const createReconciliationSession = async (
  request: CreateReconciliationSessionRequest,
): Promise<ReconciliationSession> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("create_reconciliation_session", { request });
      case RUN_ENV.WEB:
        return invokeWeb("create_reconciliation_session", { request });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error creating reconciliation session.");
    throw error;
  }
};

export const getReconciliationSession = async (
  sessionId: string,
): Promise<ReconciliationSession> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_reconciliation_session", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("get_reconciliation_session", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching reconciliation session.");
    throw error;
  }
};

export const getReconciliationSessionsByAccount = async (
  accountId: string,
): Promise<ReconciliationSession[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_reconciliation_sessions_by_account", { accountId });
      case RUN_ENV.WEB:
        return invokeWeb("get_reconciliation_sessions_by_account", { accountId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching reconciliation sessions.");
    throw error;
  }
};

export const getReconciliationSummary = async (
  sessionId: string,
): Promise<ReconciliationSummary> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_reconciliation_summary", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("get_reconciliation_summary", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching reconciliation summary.");
    throw error;
  }
};

export const completeReconciliationSession = async (
  sessionId: string,
): Promise<ReconciliationSession> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("complete_reconciliation_session", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("complete_reconciliation_session", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error completing reconciliation session.");
    throw error;
  }
};

export const cancelReconciliationSession = async (
  sessionId: string,
): Promise<ReconciliationSession> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("cancel_reconciliation_session", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("cancel_reconciliation_session", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error cancelling reconciliation session.");
    throw error;
  }
};

export const deleteReconciliationSession = async (sessionId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("delete_reconciliation_session", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("delete_reconciliation_session", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting reconciliation session.");
    throw error;
  }
};

// ============================================================================
// Item Operations (Broker Statement Entries)
// ============================================================================

export const addReconciliationItem = async (
  request: AddReconciliationItemRequest,
): Promise<ReconciliationItem> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("add_reconciliation_item", { request });
      case RUN_ENV.WEB:
        return invokeWeb("add_reconciliation_item", { request });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error adding reconciliation item.");
    throw error;
  }
};

export const addReconciliationItems = async (
  requests: AddReconciliationItemRequest[],
): Promise<ReconciliationItem[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("add_reconciliation_items", { requests });
      case RUN_ENV.WEB:
        return invokeWeb("add_reconciliation_items", { requests });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error adding reconciliation items.");
    throw error;
  }
};

export const getReconciliationItems = async (
  sessionId: string,
): Promise<ReconciliationItem[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_reconciliation_items", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("get_reconciliation_items", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching reconciliation items.");
    throw error;
  }
};

export const deleteReconciliationItem = async (itemId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("delete_reconciliation_item", { itemId });
      case RUN_ENV.WEB:
        return invokeWeb("delete_reconciliation_item", { itemId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting reconciliation item.");
    throw error;
  }
};

// ============================================================================
// Discrepancy Operations
// ============================================================================

export const calculateDiscrepancies = async (
  sessionId: string,
): Promise<ReconciliationDiscrepancy[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("calculate_discrepancies", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("calculate_discrepancies", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error calculating discrepancies.");
    throw error;
  }
};

export const getDiscrepancies = async (
  sessionId: string,
): Promise<ReconciliationDiscrepancy[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_discrepancies", { sessionId });
      case RUN_ENV.WEB:
        return invokeWeb("get_discrepancies", { sessionId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching discrepancies.");
    throw error;
  }
};

export const resolveDiscrepancy = async (
  discrepancyId: string,
  resolutionActivityId?: string,
  notes?: string,
): Promise<ReconciliationDiscrepancy> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("resolve_discrepancy", {
          discrepancyId,
          resolutionActivityId,
          notes,
        });
      case RUN_ENV.WEB:
        return invokeWeb("resolve_discrepancy", {
          discrepancyId,
          resolutionActivityId,
          notes,
        });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error resolving discrepancy.");
    throw error;
  }
};

export const ignoreDiscrepancy = async (
  discrepancyId: string,
  notes?: string,
): Promise<ReconciliationDiscrepancy> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("ignore_discrepancy", { discrepancyId, notes });
      case RUN_ENV.WEB:
        return invokeWeb("ignore_discrepancy", { discrepancyId, notes });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error ignoring discrepancy.");
    throw error;
  }
};
