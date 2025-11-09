import type { AddonContext } from "@wealthfolio/addon-sdk";
import type {
  Property,
  Loan,
  PropertyValuation,
  RealEstateData,
} from "./types";

const STORAGE_KEY = "real-estate-data";
const CURRENT_VERSION = "1.0.0";

/**
 * Default empty data structure
 */
const getDefaultData = (): RealEstateData => ({
  properties: [],
  loans: [],
  valuations: [],
  version: CURRENT_VERSION,
});

/**
 * Load real estate data from storage
 */
export async function loadData(ctx: AddonContext): Promise<RealEstateData> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      ctx.api.logger.info("No existing data found, returning default data");
      return getDefaultData();
    }

    // Parse and validate data
    const parsed = JSON.parse(data) as RealEstateData;

    // Ensure all required fields exist
    return {
      properties: parsed.properties || [],
      loans: parsed.loans || [],
      valuations: parsed.valuations || [],
      version: parsed.version || CURRENT_VERSION,
    };
  } catch (error) {
    ctx.api.logger.error("Failed to load data: " + (error as Error).message);
    return getDefaultData();
  }
}

/**
 * Save real estate data to storage
 */
export async function saveData(
  ctx: AddonContext,
  data: RealEstateData
): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    ctx.api.logger.debug("Data saved successfully");
  } catch (error) {
    ctx.api.logger.error("Failed to save data: " + (error as Error).message);
    throw error;
  }
}

/**
 * Add or update a property
 */
export async function saveProperty(
  ctx: AddonContext,
  property: Property
): Promise<void> {
  const data = await loadData(ctx);
  const index = data.properties.findIndex((p) => p.id === property.id);

  if (index >= 0) {
    // Update existing
    data.properties[index] = {
      ...property,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new
    data.properties.push(property);
  }

  await saveData(ctx, data);
}

/**
 * Delete a property and its associated loans
 */
export async function deleteProperty(
  ctx: AddonContext,
  propertyId: string
): Promise<void> {
  const data = await loadData(ctx);

  // Remove property
  data.properties = data.properties.filter((p) => p.id !== propertyId);

  // Remove associated loans
  data.loans = data.loans.filter((l) => l.propertyId !== propertyId);

  // Remove associated valuations
  data.valuations = data.valuations.filter((v) => v.propertyId !== propertyId);

  await saveData(ctx, data);
}

/**
 * Add or update a loan
 */
export async function saveLoan(ctx: AddonContext, loan: Loan): Promise<void> {
  const data = await loadData(ctx);
  const index = data.loans.findIndex((l) => l.id === loan.id);

  if (index >= 0) {
    // Update existing
    data.loans[index] = {
      ...loan,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new
    data.loans.push(loan);
  }

  await saveData(ctx, data);
}

/**
 * Delete a loan
 */
export async function deleteLoan(
  ctx: AddonContext,
  loanId: string
): Promise<void> {
  const data = await loadData(ctx);
  data.loans = data.loans.filter((l) => l.id !== loanId);
  await saveData(ctx, data);
}

/**
 * Add a property valuation
 */
export async function addValuation(
  ctx: AddonContext,
  valuation: PropertyValuation
): Promise<void> {
  const data = await loadData(ctx);
  data.valuations.push(valuation);
  await saveData(ctx, data);
}

/**
 * Get all loans for a property
 */
export async function getPropertyLoans(
  ctx: AddonContext,
  propertyId: string
): Promise<Loan[]> {
  const data = await loadData(ctx);
  return data.loans.filter((loan) => loan.propertyId === propertyId);
}

/**
 * Get valuation history for a property
 */
export async function getPropertyValuations(
  ctx: AddonContext,
  propertyId: string
): Promise<PropertyValuation[]> {
  const data = await loadData(ctx);
  return data.valuations
    .filter((v) => v.propertyId === propertyId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
