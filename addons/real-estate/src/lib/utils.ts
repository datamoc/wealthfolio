import type { Property, Loan, PropertyMetrics, PortfolioSummary } from "./types";

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate metrics for a property
 */
export function calculatePropertyMetrics(
  property: Property,
  loans: Loan[]
): PropertyMetrics {
  const propertyLoans = loans.filter((loan) => loan.propertyId === property.id);
  const totalLoanBalance = propertyLoans.reduce(
    (sum, loan) => sum + loan.currentBalance,
    0
  );
  const equity = property.currentValue - totalLoanBalance;
  const equityPercentage =
    property.currentValue > 0 ? (equity / property.currentValue) * 100 : 0;
  const totalAppreciation = property.currentValue - property.purchasePrice;
  const appreciationPercentage =
    property.purchasePrice > 0
      ? (totalAppreciation / property.purchasePrice) * 100
      : 0;
  const monthlyPayments = propertyLoans.reduce(
    (sum, loan) => sum + (loan.monthlyPayment || 0),
    0
  );

  return {
    property,
    loans: propertyLoans,
    totalLoanBalance,
    equity,
    equityPercentage,
    totalAppreciation,
    appreciationPercentage,
    monthlyPayments,
  };
}

/**
 * Calculate portfolio summary
 */
export function calculatePortfolioSummary(
  properties: Property[],
  loans: Loan[]
): PortfolioSummary {
  const totalProperties = properties.length;
  const totalValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
  const totalLoanBalance = loans.reduce((sum, l) => sum + l.currentBalance, 0);
  const totalEquity = totalValue - totalLoanBalance;
  const averageEquityPercentage =
    totalValue > 0 ? (totalEquity / totalValue) * 100 : 0;
  const totalAppreciation = properties.reduce(
    (sum, p) => sum + (p.currentValue - p.purchasePrice),
    0
  );

  return {
    totalProperties,
    totalValue,
    totalLoans: loans.length,
    totalEquity,
    averageEquityPercentage,
    totalAppreciation,
  };
}

/**
 * Sort properties by a field
 */
export function sortProperties(
  properties: Property[],
  sortBy: "name" | "value" | "purchaseDate" | "equity",
  loans: Loan[],
  ascending: boolean = true
): Property[] {
  const sorted = [...properties].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "value":
        comparison = a.currentValue - b.currentValue;
        break;
      case "purchaseDate":
        comparison = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        break;
      case "equity":
        const equityA = calculatePropertyMetrics(a, loans).equity;
        const equityB = calculatePropertyMetrics(b, loans).equity;
        comparison = equityA - equityB;
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Filter properties by search term
 */
export function filterProperties(
  properties: Property[],
  searchTerm: string
): Property[] {
  const term = searchTerm.toLowerCase().trim();

  if (!term) return properties;

  return properties.filter(
    (property) =>
      property.name.toLowerCase().includes(term) ||
      property.address.toLowerCase().includes(term) ||
      property.city?.toLowerCase().includes(term) ||
      property.type.toLowerCase().includes(term)
  );
}
