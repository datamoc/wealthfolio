import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/lib/query-keys";
import { getAddonData } from "@/commands/addon";

interface Property {
  id: string;
  name: string;
  currentValue: number;
  purchasePrice: number;
  currency: string;
  purchaseDate: string;
}

interface Loan {
  id: string;
  propertyId: string;
  currentBalance: number;
}

interface PropertyValuation {
  id: string;
  propertyId: string;
  value: number;
  date: string;
  source?: string;
  notes?: string;
  createdAt: string;
}

interface RealEstateData {
  properties: Property[];
  loans: Loan[];
  valuations?: PropertyValuation[];
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

const ADDON_ID = "real-estate-addon";
const STORAGE_KEY = "real-estate-data";

/**
 * Get property value at a specific date using valuations history
 * If no valuation exists for that date, uses the most recent valuation before that date
 * Falls back to currentValue if no historical data
 */
function getPropertyValueAtDate(
  property: Property,
  valuations: PropertyValuation[],
  targetDate?: string
): number {
  if (!targetDate || !valuations || valuations.length === 0) {
    return property.currentValue;
  }

  // Filter valuations for this property and sort by date descending
  const propertyValuations = valuations
    .filter((v) => v.propertyId === property.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (propertyValuations.length === 0) {
    return property.currentValue;
  }

  const targetTime = new Date(targetDate).getTime();

  // Find the most recent valuation before or at the target date
  const applicableValuation = propertyValuations.find((v) => {
    return new Date(v.date).getTime() <= targetTime;
  });

  // If we found a valuation at or before the target date, use it
  if (applicableValuation) {
    return applicableValuation.value;
  }

  // If all valuations are after the target date, use purchase price if before purchase date
  const purchaseTime = new Date(property.purchaseDate).getTime();
  if (targetTime < purchaseTime) {
    return 0; // Property didn't exist yet
  }

  // Otherwise use the oldest valuation (closest to purchase date)
  // Double-check array is not empty (defensive programming)
  if (propertyValuations.length > 0) {
    return propertyValuations[propertyValuations.length - 1].value || property.currentValue;
  }

  return property.currentValue;
}

/**
 * Load and calculate real estate summary from addon storage
 * @param baseCurrency - The base currency for calculations
 * @param asOfDate - Optional date to calculate historical values (ISO format YYYY-MM-DD)
 */
async function getRealEstateSummary(baseCurrency: string, asOfDate?: string): Promise<RealEstateSummary> {
  try {
    const dataStr = await getAddonData(ADDON_ID, STORAGE_KEY);

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
    const valuations = data.valuations || [];

    // Calculate totals using historical valuations if asOfDate is provided
    // Note: Assumes same currency as base - in production, you'd need currency conversion
    const totalValue = properties.reduce((sum, p) => {
      const value = getPropertyValueAtDate(p, valuations, asOfDate);
      return sum + value;
    }, 0);

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
 * Fetches data from addon database storage
 */
export function useRealEstateSummary(baseCurrency = "USD") {
  return useQuery<RealEstateSummary>({
    queryKey: [QueryKeys.REAL_ESTATE_SUMMARY, baseCurrency],
    queryFn: () => getRealEstateSummary(baseCurrency),
    // Poll every 5 seconds to get updates from the addon
    refetchInterval: 5000,
    // Don't show errors if addon is not installed (just return empty data)
    retry: false,
  });
}
