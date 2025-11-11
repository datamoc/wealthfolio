import {
  Activity,
  ActivityBulkMutationRequest,
  ActivityBulkMutationResult,
  ActivityCreate,
  ActivityDetails,
  ActivitySearchResponse,
  ActivityUpdate,
} from "@/lib/types";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

interface Filters {
  accountId?: string;
  activityType?: string;
  symbol?: string;
}

interface Sort {
  id: string;
  desc: boolean;
}

/**
 * Gets all activities for a given account.
 *
 * This is a convenience function that wraps `searchActivities` to fetch all
 * activities for an account, without pagination.
 *
 * @param {string} [accountId] - The ID of the account to fetch activities for. If not provided, fetches all activities.
 * @returns {Promise<ActivityDetails[]>} A promise that resolves with an array of activities.
 * @throws Will throw an error if the API call fails.
 */
export const getActivities = async (accountId?: string): Promise<ActivityDetails[]> => {
  try {
    const response = await searchActivities(
      0,
      Number.MAX_SAFE_INTEGER,
      accountId ? { accountId } : {},
      "",
      {
        id: "date",
        desc: true,
      },
    );
    return response.data;
  } catch (error) {
    logger.error("Error fetching all activities.");
    throw error;
  }
};

/**
 * Searches for activities with pagination, filtering, and sorting.
 *
 * @param {number} page - The page number to fetch.
 * @param {number} pageSize - The number of activities per page.
 * @param {Filters} filters - The filters to apply to the search.
 * @param {string} searchKeyword - A keyword to search for.
 * @param {Sort} sort - The sorting to apply to the results.
 * @returns {Promise<ActivitySearchResponse>} A promise that resolves with the search results.
 * @throws Will throw an error if the API call fails.
 */
export const searchActivities = async (
  page: number,
  pageSize: number,
  filters: Filters,
  searchKeyword: string,
  sort: Sort,
): Promise<ActivitySearchResponse> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("search_activities", {
          page,
          pageSize,
          accountIdFilter: filters?.accountId,
          activityTypeFilter: filters?.activityType,
          assetIdKeyword: searchKeyword,
          sort,
        });
      case RUN_ENV.WEB:
        return invokeWeb("search_activities", {
          page,
          pageSize,
          accountIdFilter: filters?.accountId,
          activityTypeFilter: filters?.activityType,
          assetIdKeyword: searchKeyword,
          sort,
        });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching activities.");
    throw error;
  }
};

/**
 * Creates a new activity.
 *
 * @param {ActivityCreate} activity - The activity data to create.
 * @returns {Promise<Activity>} A promise that resolves with the newly created activity.
 * @throws Will throw an error if the API call fails.
 */
export const createActivity = async (activity: ActivityCreate): Promise<Activity> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("create_activity", { activity: activity });
      case RUN_ENV.WEB:
        return invokeWeb("create_activity", { activity });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error creating activity.");
    throw error;
  }
};

/**
 * Updates an existing activity.
 *
 * @param {ActivityUpdate} activity - The activity data to update.
 * @returns {Promise<Activity>} A promise that resolves with the updated activity.
 * @throws Will throw an error if the API call fails.
 */
export const updateActivity = async (activity: ActivityUpdate): Promise<Activity> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_activity", { activity: activity });
      case RUN_ENV.WEB:
        return invokeWeb("update_activity", { activity });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating activity.");
    throw error;
  }
};

/**
 * Saves a batch of activities, including creates, updates, and deletes.
 *
 * @param {ActivityBulkMutationRequest} request - The bulk mutation request.
 * @returns {Promise<ActivityBulkMutationResult>} A promise that resolves with the result of the bulk mutation.
 * @throws Will throw an error if the API call fails.
 */
export const saveActivities = async (
  request: ActivityBulkMutationRequest,
): Promise<ActivityBulkMutationResult> => {
  const payload: ActivityBulkMutationRequest = {
    creates: request.creates ?? [],
    updates: request.updates ?? [],
    deleteIds: request.deleteIds ?? [],
  };
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("save_activities", { request: payload });
      case RUN_ENV.WEB:
        return invokeWeb("save_activities", { request: payload });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error saving activities.");
    throw error;
  }
};

/**
 * Deletes an activity.
 *
 * @param {string} activityId - The ID of the activity to delete.
 * @returns {Promise<Activity>} A promise that resolves with the deleted activity.
 * @throws Will throw an error if the API call fails.
 */
export const deleteActivity = async (activityId: string): Promise<Activity> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("delete_activity", { activityId });
      case RUN_ENV.WEB:
        return invokeWeb("delete_activity", { activityId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting activity.");
    throw error;
  }
};
