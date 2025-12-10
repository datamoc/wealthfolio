import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/lib/query-keys";
import { getAddonData } from "@/commands/addon";

export interface RealEstateProperty {
  id: string;
  name: string;
  currentValue: number;
  purchasePrice: number;
  currency: string;
  purchaseDate: string;
  equity?: number;  // Add equity field
  loanBalance?: number;  // Add loan balance field
}

interface Loan {
  id: string;
  propertyId: string;
  currentBalance: number;
}

interface RealEstateData {
  properties: RealEstateProperty[];
  loans: Loan[];
}

const ADDON_ID = "real-estate-addon";
const STORAGE_KEY = "real-estate-data";

/**
 * Load real estate properties from addon storage
 * Returns properties with their current equity (value - loans)
 */
async function getRealEstateProperties(): Promise<RealEstateProperty[]> {
  try {
    const dataStr = await getAddonData(ADDON_ID, STORAGE_KEY);

    if (!dataStr) {
      return [];
    }

    const data: RealEstateData = JSON.parse(dataStr);
    const properties = data.properties || [];
    const loans = data.loans || [];

    // Create a map of property ID to total loan balance
    const loansByProperty = new Map<string, number>();
    loans.forEach(loan => {
      const currentBalance = loansByProperty.get(loan.propertyId) || 0;
      loansByProperty.set(loan.propertyId, currentBalance + loan.currentBalance);
    });

    // Add equity and loan balance to each property
    return properties.map(property => {
      const loanBalance = loansByProperty.get(property.id) || 0;
      const equity = property.currentValue - loanBalance;

      return {
        ...property,
        equity,
        loanBalance,
      };
    });
  } catch (error) {
    console.error("Failed to load real estate properties:", error);
    return [];
  }
}

/**
 * Hook to get individual real estate properties
 * Fetches data from addon database storage
 */
export function useRealEstateProperties() {
  return useQuery<RealEstateProperty[]>({
    queryKey: [QueryKeys.REAL_ESTATE_PROPERTIES],
    queryFn: getRealEstateProperties,
    // Poll every 5 seconds to get updates from the addon
    refetchInterval: 5000,
    // Don't show errors if addon is not installed (just return empty data)
    retry: false,
  });
}
