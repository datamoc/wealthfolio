/**
 * Property type classification
 */
export type PropertyType =
  | "residential"
  | "commercial"
  | "land"
  | "rental"
  | "vacation"
  | "mixed-use";

/**
 * Loan/Mortgage type
 */
export type LoanType =
  | "fixed"
  | "variable"
  | "interest-only"
  | "adjustable"
  | "home-equity";

/**
 * Loan event types
 */
export type LoanEventType =
  | "postponement" // Defer payments for a period
  | "early_reimbursement_duration" // Extra payment reducing loan duration
  | "early_reimbursement_payment" // Extra payment reducing monthly payment
  | "rate_change" // Interest rate adjustment
  | "refinance"; // Loan refinancing

/**
 * Represents a loan event (modifications to loan terms)
 */
export interface LoanEvent {
  id: string;
  loanId: string;
  type: LoanEventType;
  date: string; // ISO date when event occurs
  amount?: number; // For early reimbursements
  previousMonthlyPayment?: number;
  newMonthlyPayment?: number;
  previousEndDate?: string;
  newEndDate?: string;
  previousInterestRate?: number;
  newInterestRate?: number;
  postponementMonths?: number; // For postponements
  notes?: string;
  createdAt: string;
}

/**
 * Represents a real estate property
 */
export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  purchaseDate: string; // ISO date
  purchasePrice: number;
  currentValue: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a loan/mortgage associated with a property
 */
export interface Loan {
  id: string;
  propertyId: string;
  name: string;
  type: LoanType;
  lender: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number; // Annual percentage rate
  startDate: string; // ISO date
  endDate?: string; // ISO date - maturity date
  monthlyPayment?: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a property valuation history entry
 */
export interface PropertyValuation {
  id: string;
  propertyId: string;
  value: number;
  date: string; // ISO date
  source?: string; // e.g., "appraisal", "market", "manual"
  notes?: string;
  createdAt: string;
}

/**
 * Calculated metrics for a property
 */
export interface PropertyMetrics {
  property: Property;
  loans: Loan[];
  totalLoanBalance: number;
  equity: number; // currentValue - totalLoanBalance
  equityPercentage: number; // (equity / currentValue) * 100
  totalAppreciation: number; // currentValue - purchasePrice
  appreciationPercentage: number; // ((currentValue - purchasePrice) / purchasePrice) * 100
  monthlyPayments: number; // Sum of all loan monthly payments
}

/**
 * Summary statistics for all properties
 */
export interface PortfolioSummary {
  totalProperties: number;
  totalValue: number;
  totalLoans: number;
  totalEquity: number;
  averageEquityPercentage: number;
  totalAppreciation: number;
}

/**
 * Storage data structure
 */
export interface RealEstateData {
  properties: Property[];
  loans: Loan[];
  valuations: PropertyValuation[];
  loanEvents: LoanEvent[];
  version: string;
}
