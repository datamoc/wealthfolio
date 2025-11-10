import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/lib/query-keys";

interface Property {
  id: string;
  name: string;
  currentValue: number;
  purchasePrice: number;
  currency: string;
}

interface Loan {
  id: string;
  propertyId: string;
  currentBalance: number;
}

interface RealEstateData {
  properties: Property[];
  loans: Loan[];
}

interface RealEstateSummary {
  totalValue: number;
  totalLoans: number;
  totalEquity: number;
  propertyCount: number;
  currency: string;
  totalAppreciation: number;
  appreciationPercent: number;
}

const STORAGE_KEY = "real-estate-data";

/**
 * Load and calculate real estate summary from addon storage
 */
function getRealEstateSummary(baseCurrency: string): RealEstateSummary {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY);

    if (!dataStr) {
      return {
        totalValue: 0,
        totalLoans: 0,
        totalEquity: 0,
        propertyCount: 0,
        currency: baseCurrency,
        totalAppreciation: 0,
        appreciationPercent: 0,
      };
    }

    const data: RealEstateData = JSON.parse(dataStr);
    const properties = data.properties || [];
    const loans = data.loans || [];

    // Calculate totals (simplified - assumes same currency as base)
    // In a production app, you'd need to convert currencies
    const totalValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.currentBalance, 0);
    const totalEquity = totalValue - totalLoans;
    const totalAppreciation = totalValue - totalPurchasePrice;
    const appreciationPercent = totalPurchasePrice > 0 ? (totalAppreciation / totalPurchasePrice) : 0;

    return {
      totalValue,
      totalLoans,
      totalEquity,
      propertyCount: properties.length,
      currency: baseCurrency,
      totalAppreciation,
      appreciationPercent,
    };
  } catch (error) {
    console.error("Failed to load real estate data:", error);
    return {
      totalValue: 0,
      totalLoans: 0,
      totalEquity: 0,
      propertyCount: 0,
      currency: baseCurrency,
      totalAppreciation: 0,
      appreciationPercent: 0,
    };
  }
}

/**
 * Hook to get real estate summary for dashboard
 */
export function useRealEstateSummary(baseCurrency: string = "USD") {
  return useQuery<RealEstateSummary>({
    queryKey: [QueryKeys.REAL_ESTATE_SUMMARY, baseCurrency],
    queryFn: () => getRealEstateSummary(baseCurrency),
    // Poll every 5 seconds to catch updates from the addon
    refetchInterval: 5000,
  });
}
