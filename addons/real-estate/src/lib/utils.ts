import Finance from "financejs";
import type { Property, Loan, PropertyMetrics, PortfolioSummary } from "./types";

const finance = new Finance();

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
 * Calculate monthly payment from loan parameters using financejs
 * @param principal - Loan amount
 * @param annualInterestRate - Annual interest rate as percentage (e.g., 3.45 for 3.45%)
 * @param months - Number of months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  months: number
): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualInterestRate === 0) return principal / months;

  // financejs PMT method: PMT(rate, nper, pv, fv, type)
  // rate: monthly rate as decimal
  // nper: number of periods
  // pv: present value (negative for money borrowed)
  // fv: future value (0 for loan fully paid)
  // type: 0 for end of period payment
  const monthlyRateDecimal = annualInterestRate / 100 / 12;
  const payment = finance.PMT(monthlyRateDecimal, months, -principal, 0, 0);

  return Math.round(payment * 100) / 100;
}

/**
 * Calculate annual interest rate from monthly payment using bisection method with financejs
 * @param principal - Loan amount
 * @param monthlyPayment - Target monthly payment
 * @param months - Number of months
 * @returns Annual interest rate as percentage (e.g., 3.45 for 3.45%)
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

  // If monthly payment is less than minimum, something is wrong
  if (monthlyPayment < minPayment) return 0;

  // Helper function to calculate monthly payment for a given annual rate using financejs
  const calcPayment = (annualRatePercent: number): number => {
    if (annualRatePercent === 0) return principal / months;
    const monthlyRateDecimal = annualRatePercent / 100 / 12;
    return finance.PMT(monthlyRateDecimal, months, -principal, 0, 0);
  };

  // Bisection method to find the interest rate
  let lowRate = 0; // 0% annual rate
  let highRate = 50; // 50% annual rate (very high upper bound)
  const maxIterations = 100;
  const tolerance = 0.00001; // Tight tolerance for accuracy

  // First, check if we need a higher upper bound
  while (calcPayment(highRate) < monthlyPayment && highRate < 100) {
    highRate += 10;
  }

  // Bisection search
  for (let i = 0; i < maxIterations; i++) {
    const midRate = (lowRate + highRate) / 2;
    const calculatedPayment = calcPayment(midRate);
    const diff = calculatedPayment - monthlyPayment;

    // Check if we're close enough
    if (Math.abs(diff) < 0.01) {
      return Math.round(midRate * 100) / 100; // Return as percentage with 2 decimals
    }

    // Adjust bounds
    if (diff > 0) {
      highRate = midRate; // Rate is too high
    } else {
      lowRate = midRate; // Rate is too low
    }

    // Check if bounds are converging
    if (Math.abs(highRate - lowRate) < tolerance) {
      const finalRate = (lowRate + highRate) / 2;
      return Math.round(finalRate * 100) / 100;
    }
  }

  // Return midpoint if we didn't converge (shouldn't happen with bisection)
  const finalRate = (lowRate + highRate) / 2;
  return Math.round(finalRate * 100) / 100;
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

/**
 * Get default currency for a country
 * Maps country names (and common variations) to their primary currencies
 */
export function getCurrencyForCountry(country: string): string {
  const countryLower = country.toLowerCase().trim();

  // Country to currency mapping (most common countries and variations)
  const countryToCurrency: Record<string, string> = {
    // North America
    'united states': 'USD',
    'usa': 'USD',
    'us': 'USD',
    'america': 'USD',
    'canada': 'CAD',
    'mexico': 'MXN',

    // Europe
    'germany': 'EUR',
    'france': 'EUR',
    'spain': 'EUR',
    'italy': 'EUR',
    'netherlands': 'EUR',
    'belgium': 'EUR',
    'austria': 'EUR',
    'portugal': 'EUR',
    'greece': 'EUR',
    'ireland': 'EUR',
    'finland': 'EUR',
    'luxembourg': 'EUR',
    'slovakia': 'EUR',
    'slovenia': 'EUR',
    'estonia': 'EUR',
    'latvia': 'EUR',
    'lithuania': 'EUR',
    'malta': 'EUR',
    'cyprus': 'EUR',
    'united kingdom': 'GBP',
    'uk': 'GBP',
    'britain': 'GBP',
    'england': 'GBP',
    'scotland': 'GBP',
    'wales': 'GBP',
    'switzerland': 'CHF',
    'sweden': 'SEK',
    'norway': 'NOK',
    'denmark': 'DKK',
    'poland': 'PLN',
    'czech republic': 'CZK',
    'czechia': 'CZK',
    'hungary': 'HUF',
    'romania': 'RON',
    'bulgaria': 'BGN',
    'croatia': 'EUR',
    'iceland': 'ISK',

    // Asia Pacific
    'japan': 'JPY',
    'china': 'CNY',
    'south korea': 'KRW',
    'korea': 'KRW',
    'hong kong': 'HKD',
    'singapore': 'SGD',
    'india': 'INR',
    'australia': 'AUD',
    'new zealand': 'NZD',
    'thailand': 'THB',
    'malaysia': 'MYR',
    'indonesia': 'IDR',
    'philippines': 'PHP',
    'vietnam': 'VND',
    'taiwan': 'TWD',

    // Middle East
    'united arab emirates': 'AED',
    'uae': 'AED',
    'dubai': 'AED',
    'saudi arabia': 'SAR',
    'israel': 'ILS',
    'turkey': 'TRY',
    'qatar': 'QAR',
    'kuwait': 'KWD',

    // South America
    'brazil': 'BRL',
    'argentina': 'ARS',
    'chile': 'CLP',
    'colombia': 'COP',
    'peru': 'PEN',

    // Africa
    'south africa': 'ZAR',
    'nigeria': 'NGN',
    'egypt': 'EGP',
    'kenya': 'KES',
    'morocco': 'MAD',

    // Other
    'russia': 'RUB',
    'ukraine': 'UAH',
  };

  return countryToCurrency[countryLower] || 'USD'; // Default to USD if country not found
}
