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

/**
 * Calculate monthly payment from loan parameters
 * Formula: M = P * [r(1 + r)^n] / [(1 + r)^n - 1]
 * Where:
 * - M = Monthly payment
 * - P = Principal (loan amount)
 * - r = Monthly interest rate (annual rate / 12 / 100)
 * - n = Number of months
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  months: number
): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualInterestRate === 0) return principal / months;

  const monthlyRate = annualInterestRate / 12 / 100;
  const denominator = Math.pow(1 + monthlyRate, months) - 1;

  if (denominator === 0) return 0;

  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / denominator;

  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Calculate annual interest rate from monthly payment using Newton-Raphson method
 * This is an iterative approximation since there's no closed-form solution
 */
export function calculateInterestRate(
  principal: number,
  monthlyPayment: number,
  months: number
): number {
  if (principal <= 0 || monthlyPayment <= 0 || months <= 0) return 0;

  // If monthly payment equals principal/months, interest rate is 0
  const minPayment = principal / months;
  if (Math.abs(monthlyPayment - minPayment) < 0.01) return 0;

  // Newton-Raphson method to find the interest rate
  let rate = 0.05; // Initial guess: 5% annual rate
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    const monthlyRate = rate / 12;
    const x = Math.pow(1 + monthlyRate, months);

    // Calculate the function value and derivative
    const fx = principal * monthlyRate * x / (x - 1) - monthlyPayment;
    const dfx = principal * ((x * (months * (x - 1) - x * monthlyRate * months)) / Math.pow(x - 1, 2)) / 12;

    if (Math.abs(dfx) < 1e-10) break; // Avoid division by very small number

    const newRate = rate - fx / dfx;

    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 10000) / 100; // Return as percentage with 2 decimals
    }

    rate = newRate;

    // Keep rate in reasonable bounds
    if (rate < 0) rate = 0;
    if (rate > 1) rate = 1; // Max 100% annual rate
  }

  return Math.round(rate * 10000) / 100;
}

/**
 * Calculate number of months between two dates
 */
export function calculateMonthsBetweenDates(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();

  return years * 12 + months;
}
