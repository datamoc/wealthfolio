import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format amount with currency support, including special handling for pence (GBp/GBX)
 * Uses browser's locale for proper number formatting (e.g., French uses "800 000,00 €")
 */
export function formatAmount(amount: number, currency: string, displayCurrency = true, locale?: string) {
  const effectiveLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  // Handle pence (GBp) specially
  if (currency === "GBp" || currency === "GBX") {
    if (!displayCurrency) {
      return new Intl.NumberFormat(effectiveLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }

    // For pence, format as "123.45p" or "1,234.56p"
    const formattedNumber = new Intl.NumberFormat(effectiveLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${formattedNumber}p`;
  }

  return new Intl.NumberFormat(effectiveLocale, {
    style: displayCurrency ? "currency" : undefined,
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage values with proper formatting
 * Uses browser's locale for proper number formatting (e.g., French uses "3,45 %" with space)
 */
export function formatPercent(value: number | null | undefined, locale?: string) {
  if (value == null) return "-";
  try {
    const effectiveLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
    // Use Intl.NumberFormat for correct percentage formatting (handles x100 and % sign)
    return new Intl.NumberFormat(effectiveLocale, {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error(`Error formatting percent ${value}: ${error}`);
    // Fallback to simple string conversion if formatting fails
    return `${value}%`;
  }
}

export function formatQuantity(quantity: string | number) {
  const numQuantity = parseFloat(String(quantity));
  if (Number.isInteger(numQuantity)) {
    return numQuantity.toString();
  } else {
    return numQuantity.toFixed(6);
  }
}
