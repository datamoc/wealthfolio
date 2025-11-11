import type { QuoteImport } from "@/lib/types/quote-import";
import {
  QuoteSummary,
  Asset,
  Quote,
  UpdateAssetProfile,
  MarketDataProviderInfo,
} from "@/lib/types";
import { getRunEnv, RUN_ENV, invokeTauri, invokeWeb, logger } from "@/adapters";

// Interface matching the backend struct
export interface MarketDataProviderSetting {
  id: string;
  name: string;
  description: string;
  url: string | null;
  priority: number;
  enabled: boolean;
  logoFilename: string | null;
  lastSyncedAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

/**
 * Searches for a ticker symbol.
 *
 * @param {string} query - The search query.
 * @returns {Promise<QuoteSummary[]>} A promise that resolves with a list of quote summaries.
 * @throws Will throw an error if the API call fails.
 */
export const searchTicker = async (query: string): Promise<QuoteSummary[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("search_symbol", { query });
      case RUN_ENV.WEB:
        return invokeWeb("search_symbol", { query });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error searching for ticker.");
    throw error;
  }
};

/**
 * Syncs the history of quotes for all assets.
 *
 * @returns {Promise<void>} A promise that resolves when the sync is complete.
 * @throws Will throw an error if the API call fails.
 */
export const syncHistoryQuotes = async (): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        await invokeTauri("synch_quotes");
        return;
      case RUN_ENV.WEB:
        await invokeWeb("synch_quotes");
        return;
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error syncing history quotes.");
    throw error;
  }
};

/**
 * Gets the profile for a specific asset.
 *
 * @param {string} assetId - The ID of the asset.
 * @returns {Promise<Asset>} A promise that resolves with the asset profile.
 * @throws Will throw an error if the API call fails.
 */
export const getAssetProfile = async (assetId: string): Promise<Asset> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_asset_profile", { assetId });
      case RUN_ENV.WEB:
        return invokeWeb("get_asset_profile", { assetId });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error loading asset data.");
    throw error;
  }
};

/**
 * Updates the profile for an asset.
 *
 * @param {UpdateAssetProfile} payload - The updated asset profile data.
 * @returns {Promise<Asset>} A promise that resolves with the updated asset profile.
 * @throws Will throw an error if the API call fails.
 */
export const updateAssetProfile = async (payload: UpdateAssetProfile): Promise<Asset> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_asset_profile", { id: payload.symbol, payload });
      case RUN_ENV.WEB:
        return invokeWeb("update_asset_profile", { id: payload.symbol, payload });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating asset profile.");
    throw error;
  }
};

/**
 * Updates the data source for an asset.
 *
 * @param {string} symbol - The symbol of the asset.
 * @param {string} dataSource - The new data source.
 * @returns {Promise<Asset>} A promise that resolves with the updated asset.
 * @throws Will throw an error if the API call fails.
 */
export const updateAssetDataSource = async (symbol: string, dataSource: string): Promise<Asset> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_asset_data_source", { id: symbol, dataSource });
      case RUN_ENV.WEB:
        return invokeWeb("update_asset_data_source", { id: symbol, dataSource });
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error updating asset data source.");
    throw error;
  }
};

/**
 * Updates a quote for a specific symbol.
 *
 * @param {string} symbol - The symbol of the quote to update.
 * @param {Quote} quote - The updated quote data.
 * @returns {Promise<void>} A promise that resolves when the quote is updated.
 * @throws Will throw an error if the API call fails.
 */
export const updateQuote = async (symbol: string, quote: Quote): Promise<void> => {
  try {
    const runEnv = getRunEnv();
    if (runEnv === RUN_ENV.DESKTOP) {
      return invokeTauri("update_quote", { symbol, quote: quote });
    }
    if (runEnv === RUN_ENV.WEB) {
      return invokeWeb("update_quote", { symbol, quote });
    }
  } catch (error) {
    logger.error("Error updating quote");
    throw error;
  }
};

/**
 * Syncs market data for a list of symbols.
 *
 * @param {string[]} symbols - The symbols to sync.
 * @param {boolean} refetchAll - Whether to refetch all data, or only missing data.
 * @returns {Promise<void>} A promise that resolves when the sync is complete.
 * @throws Will throw an error if the API call fails.
 */
export const syncMarketData = async (symbols: string[], refetchAll: boolean): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        await invokeTauri("sync_market_data", { symbols, refetchAll });
        return;
      case RUN_ENV.WEB:
        await invokeWeb("sync_market_data", { symbols, refetchAll });
        return;
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error(`Error refreshing quotes for symbols: ${String(error)}`);
    throw error;
  }
};

/**
 * Deletes a quote.
 *
 * @param {string} id - The ID of the quote to delete.
 * @returns {Promise<void>} A promise that resolves when the quote is deleted.
 * @throws Will throw an error if the API call fails.
 */
export const deleteQuote = async (id: string): Promise<void> => {
  try {
    const runEnv = getRunEnv();
    if (runEnv === RUN_ENV.DESKTOP) {
      return invokeTauri("delete_quote", { id });
    }
    if (runEnv === RUN_ENV.WEB) {
      return invokeWeb("delete_quote", { id });
    }
  } catch (error) {
    logger.error("Error deleting quote");
    throw error;
  }
};

/**
 * Gets the historical quotes for a symbol.
 *
 * @param {string} symbol - The symbol to fetch history for.
 * @returns {Promise<Quote[]>} A promise that resolves with a list of historical quotes.
 * @throws Will throw an error if the API call fails.
 */
export const getQuoteHistory = async (symbol: string): Promise<Quote[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return await invokeTauri("get_quote_history", { symbol });
      case RUN_ENV.WEB:
        return await invokeWeb("get_quote_history", { symbol });
      default:
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error(`Error fetching quote history for symbol ${symbol}.`);
    throw error;
  }
};

/**
 * Gets a list of all available market data providers.
 *
 * @returns {Promise<MarketDataProviderInfo[]>} A promise that resolves with a list of market data providers.
 * @throws Will throw an error if the API call fails.
 */
export const getMarketDataProviders = async (): Promise<MarketDataProviderInfo[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_market_data_providers");
      case RUN_ENV.WEB:
        return invokeWeb("get_market_data_providers");
      default:
        logger.error("Unsupported environment for getMarketDataProviders");
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error("Error fetching market data providers.");
    throw error;
  }
};

/**
 * Gets the settings for all market data providers.
 *
 * @returns {Promise<MarketDataProviderSetting[]>} A promise that resolves with a list of market data provider settings.
 * @throws Will throw an error if the API call fails.
 */
export const getMarketDataProviderSettings = async (): Promise<MarketDataProviderSetting[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("get_market_data_providers_settings");
      case RUN_ENV.WEB:
        return invokeWeb("get_market_data_providers_settings");
      default:
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error("Error fetching market data provider settings.");
    throw error;
  }
};

/**
 * Updates the settings for a market data provider.
 *
 * @param {object} payload - The settings to update.
 * @param {string} payload.providerId - The ID of the provider.
 * @param {number} payload.priority - The priority of the provider.
 * @param {boolean} payload.enabled - Whether the provider is enabled.
 * @returns {Promise<MarketDataProviderSetting>} A promise that resolves with the updated settings.
 * @throws Will throw an error if the API call fails.
 */
export const updateMarketDataProviderSettings = async (payload: {
  providerId: string;
  priority: number;
  enabled: boolean;
}): Promise<MarketDataProviderSetting> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("update_market_data_provider_settings", payload);
      case RUN_ENV.WEB:
        return invokeWeb("update_market_data_provider_settings", payload);
      default:
        throw new Error(`Unsupported environment`);
    }
  } catch (error) {
    logger.error("Error updating market data provider settings.");
    throw error;
  }
};

/**
 * Imports manual quotes from a CSV file.
 * This is only supported in the desktop environment.
 *
 * @param {QuoteImport[]} quotes - The quotes to import.
 * @param {boolean} overwriteExisting - Whether to overwrite existing quotes.
 * @returns {Promise<QuoteImport[]>} A promise that resolves with the imported quotes, potentially with errors.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const importManualQuotes = async (
  quotes: QuoteImport[],
  overwriteExisting: boolean,
): Promise<QuoteImport[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri("import_quotes_csv", { quotes, overwriteExisting });
      case RUN_ENV.WEB:
        throw new Error("Manual quote import is only available on desktop.");
      default:
        throw new Error("Manual quote import is not supported in this environment.");
    }
  } catch (error) {
    logger.error("Error importing manual quotes.");
    throw error;
  }
};
