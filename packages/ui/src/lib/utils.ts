import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to merge Tailwind CSS classes.
 *
 * @param {...ClassValue[]} inputs - A list of class names to merge.
 * @returns {string} The merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an amount with currency support, including special handling for pence (GBp/GBX).
 *
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency to format the amount in.
 * @param {boolean} [displayCurrency=true] - Whether to display the currency symbol.
 * @returns {string} The formatted amount.
 */
export function formatAmount(amount: number, currency: string, displayCurrency = true) {
  // Handle pence (GBp) specially
  if (currency === "GBp" || currency === "GBX") {
    if (!displayCurrency) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }

    // For pence, format as "123.45p" or "1,234.56p"
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${formattedNumber}p`;
  }

  return new Intl.NumberFormat("en-US", {
    style: displayCurrency ? "currency" : undefined,
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as a percentage.
 *
 * @param {(number | null | undefined)} value - The value to format.
 * @returns {string} The formatted percentage, or "-" if the value is null or undefined.
 */
export function formatPercent(value: number | null | undefined) {
  if (value == null) return "-";
  try {
    // Use Intl.NumberFormat for correct percentage formatting (handles x100 and % sign)
    return new Intl.NumberFormat("en-US", {
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

/**
 * Formats a quantity, displaying integers as-is and floats with up to 6 decimal places.
 *
 * @param {(string | number)} quantity - The quantity to format.
 * @returns {string} The formatted quantity.
 */
export function formatQuantity(quantity: string | number) {
  const numQuantity = parseFloat(String(quantity));
  if (Number.isInteger(numQuantity)) {
    return numQuantity.toString();
  } else {
    return numQuantity.toFixed(6);
  }
}
