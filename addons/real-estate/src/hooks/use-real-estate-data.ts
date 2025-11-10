import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AddonContext } from "@wealthfolio/addon-sdk";
import {
  loadData,
  saveProperty,
  deleteProperty,
  saveLoan,
  deleteLoan,
  addValuation,
} from "../lib/storage";
import type { Property, Loan, PropertyValuation } from "../lib/types";

const QUERY_KEY = ["real-estate"];

/**
 * Hook to manage real estate data
 */
export function useRealEstateData(ctx: AddonContext) {
  const queryClient = useQueryClient();

  // Query for loading data
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => loadData(ctx),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for saving a property
  const savePropertyMutation = useMutation({
    mutationFn: (property: Property) => saveProperty(ctx, property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      ctx.api.logger.info("Property saved successfully");
    },
    onError: (error) => {
      ctx.api.logger.error("Failed to save property: " + (error as Error).message);
    },
  });

  // Mutation for deleting a property
  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) => deleteProperty(ctx, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      ctx.api.logger.info("Property deleted successfully");
    },
    onError: (error) => {
      ctx.api.logger.error("Failed to delete property: " + (error as Error).message);
    },
  });

  // Mutation for saving a loan
  const saveLoanMutation = useMutation({
    mutationFn: (loan: Loan) => saveLoan(ctx, loan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      ctx.api.logger.info("Loan saved successfully");
    },
    onError: (error) => {
      ctx.api.logger.error("Failed to save loan: " + (error as Error).message);
    },
  });

  // Mutation for deleting a loan
  const deleteLoanMutation = useMutation({
    mutationFn: (loanId: string) => deleteLoan(ctx, loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      ctx.api.logger.info("Loan deleted successfully");
    },
    onError: (error) => {
      ctx.api.logger.error("Failed to delete loan: " + (error as Error).message);
    },
  });

  // Mutation for adding a valuation
  const addValuationMutation = useMutation({
    mutationFn: (valuation: PropertyValuation) => addValuation(ctx, valuation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      ctx.api.logger.info("Valuation added successfully");
    },
    onError: (error) => {
      ctx.api.logger.error("Failed to add valuation: " + (error as Error).message);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    saveProperty: savePropertyMutation.mutateAsync,
    deleteProperty: deletePropertyMutation.mutateAsync,
    saveLoan: saveLoanMutation.mutateAsync,
    deleteLoan: deleteLoanMutation.mutateAsync,
    addValuation: addValuationMutation.mutateAsync,
    isSaving:
      savePropertyMutation.isPending ||
      deletePropertyMutation.isPending ||
      saveLoanMutation.isPending ||
      deleteLoanMutation.isPending ||
      addValuationMutation.isPending,
  };
}
