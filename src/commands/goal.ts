import z from "zod";
import { Goal, GoalAllocation } from "@/lib/types";
import { newGoalSchema } from "@/lib/schemas";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb } from "@/adapters";
import { logger } from "@/adapters";

type NewGoal = z.infer<typeof newGoalSchema>;

/**
 * Gets all goals.
 *
 * @returns {Promise<Goal[]>} A promise that resolves with a list of goals.
 * @throws Will throw an error if the API call fails.
 */
export const getGoals = async (): Promise<Goal[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_goals");
      case RUN_ENV.WEB:
        return invokeWeb("get_goals");
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching goals.");
    throw error;
  }
};

/**
 * Creates a new goal.
 *
 * @param {NewGoal} goal - The data for the new goal.
 * @returns {Promise<Goal>} A promise that resolves with the newly created goal.
 * @throws Will throw an error if the API call fails.
 */
export const createGoal = async (goal: NewGoal): Promise<Goal> => {
  const newGoal = {
    ...goal,
    yearlyContribution: 0,
    goalType: "NEEDS",
    isAchieved: false,
  };
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("create_goal", { goal: newGoal });
      case RUN_ENV.WEB:
        return invokeWeb("create_goal", { goal: newGoal });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error creating goal.");
    throw error;
  }
};

/**
 * Updates an existing goal.
 *
 * @param {Goal} goal - The updated goal data.
 * @returns {Promise<Goal>} A promise that resolves with the updated goal.
 * @throws Will throw an error if the API call fails.
 */
export const updateGoal = async (goal: Goal): Promise<Goal> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_goal", { goal });
      case RUN_ENV.WEB:
        return invokeWeb("update_goal", { goal });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating goal.");
    throw error;
  }
};

/**
 * Deletes a goal.
 *
 * @param {string} goalId - The ID of the goal to delete.
 * @returns {Promise<void>} A promise that resolves when the goal is deleted.
 * @throws Will throw an error if the API call fails.
 */
export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        await invokeTauri("delete_goal", { goalId });
        return;
      case RUN_ENV.WEB:
        await invokeWeb("delete_goal", { goalId });
        return;
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error deleting goal.");
    throw error;
  }
};

/**
 * Updates the allocations for all goals.
 *
 * @param {GoalAllocation[]} allocations - A list of goal allocations.
 * @returns {Promise<void>} A promise that resolves when the allocations are updated.
 * @throws Will throw an error if the API call fails.
 */
export const updateGoalsAllocations = async (allocations: GoalAllocation[]): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        await invokeTauri("update_goal_allocations", { allocations });
        return;
      case RUN_ENV.WEB:
        await invokeWeb("update_goal_allocations", { allocations });
        return;
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error saving goals allocations.");
    throw error;
  }
};

/**
 * Gets the allocations for all goals.
 *
 * @returns {Promise<GoalAllocation[]>} A promise that resolves with a list of goal allocations.
 * @throws Will throw an error if the API call fails.
 */
export const getGoalsAllocation = async (): Promise<GoalAllocation[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("load_goals_allocations");
      case RUN_ENV.WEB:
        return invokeWeb("load_goals_allocations");
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error fetching goals allocations.");
    throw error;
  }
};
