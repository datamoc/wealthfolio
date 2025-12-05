import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

export interface FinanceDatabaseSearchResult {
  symbol: string;
  name: string;
  assetType: string;
  currency: string;
  exchange: string | null;
  category: string | null;
  summary: string | null;
}

export interface FinanceDatabaseStats {
  total: number;
  etfCount: number;
  fundCount: number;
  cryptoCount: number;
}

/**
 * Search for assets in the FinanceDatabase
 * @param query - Search query (symbol or name)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching assets
 */
export const searchFinanceDatabase = async (
  query: string,
  limit?: number,
): Promise<FinanceDatabaseSearchResult[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("search_finance_database", { query, limit });
      case RUN_ENV.WEB:
        return invokeWeb("search_finance_database", { query, limit });
      default:
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error("Error searching FinanceDatabase.");
    throw error;
  }
};

/**
 * Import FinanceDatabase CSV file into the local database
 * @param csvPath - Path to the CSV file
 * @param assetType - Type of assets: 'ETF', 'FUND', or 'CRYPTO'
 * @returns Number of assets imported
 */
export const importFinanceDatabaseCsv = async (
  csvPath: string,
  assetType: "ETF" | "FUND" | "CRYPTO",
): Promise<number> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("import_finance_database_csv", { csvPath, assetType });
      case RUN_ENV.WEB:
        throw new Error("CSV import is only available on desktop.");
      default:
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error(`Error importing FinanceDatabase CSV (${assetType}).`);
    throw error;
  }
};

/**
 * Get statistics about imported FinanceDatabase assets
 * @returns Statistics including total count and counts by type
 */
export const getFinanceDatabaseStats = async (): Promise<FinanceDatabaseStats> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_finance_database_stats");
      case RUN_ENV.WEB:
        return invokeWeb("get_finance_database_stats");
      default:
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error("Error fetching FinanceDatabase statistics.");
    throw error;
  }
};
