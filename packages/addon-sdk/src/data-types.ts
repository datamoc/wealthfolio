/**
 * Comprehensive data types for Wealthfolio addons
 * These types mirror the main application types to ensure compatibility
 */

/**
 * An enumeration of possible activity types.
 */
export const ActivityType = {
  /** A purchase of an asset. */
  BUY: 'BUY',
  /** A sale of an asset. */
  SELL: 'SELL',
  /** A dividend payment from an asset. */
  DIVIDEND: 'DIVIDEND',
  /** An interest payment. */
  INTEREST: 'INTEREST',
  /** A cash deposit into an account. */
  DEPOSIT: 'DEPOSIT',
  /** A cash withdrawal from an account. */
  WITHDRAWAL: 'WITHDRAWAL',
  /** Manually adding a holding to an account. */
  ADD_HOLDING: 'ADD_HOLDING',
  /** Manually removing a holding from an account. */
  REMOVE_HOLDING: 'REMOVE_HOLDING',
  /** Transferring an asset into an account. */
  TRANSFER_IN: 'TRANSFER_IN',
  /** Transferring an asset out of an account. */
  TRANSFER_OUT: 'TRANSFER_OUT',
  /** A fee charged to an account. */
  FEE: 'FEE',
  /** A tax payment. */
  TAX: 'TAX',
  /** A stock split. */
  SPLIT: 'SPLIT',
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

/**
 * An enumeration of possible data sources for market data.
 */
export const DataSource = {
  /** Data from Yahoo Finance. */
  YAHOO: 'YAHOO',
  /** Manually entered data. */
  MANUAL: 'MANUAL',
} as const;

export type DataSource = (typeof DataSource)[keyof typeof DataSource];

/**
 * An enumeration of possible account types.
 */
export const AccountType = {
  /** An account for holding securities like stocks and ETFs. */
  SECURITIES: 'SECURITIES',
  /** A cash account. */
  CASH: 'CASH',
  /** A cryptocurrency account. */
  CRYPTOCURRENCY: 'CRYPTOCURRENCY',
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

/**
 * An enumeration of possible holding types.
 */
export const HoldingType = {
  /** A cash holding. */
  CASH: 'cash',
  /** A security holding. */
  SECURITY: 'security',
} as const;

export type HoldingType = (typeof HoldingType)[keyof typeof HoldingType];

export type ImportRequiredField = 'symbol' | 'quantity' | 'price' | 'date' | 'type';

/**
 * Represents a user's account.
 */
export interface Account {
  /** The unique ID of the account. */
  id: string;
  /** The name of the account. */
  name: string;
  /** The type of the account. */
  accountType: AccountType;
  /** An optional group for the account. */
  group?: string;
  /** The cash balance of the account. */
  balance: number;
  /** The currency of the account. */
  currency: string;
  /** Whether this is the default account. */
  isDefault: boolean;
  /** Whether this account is active. */
  isActive: boolean;
  /** The creation date of the account. */
  createdAt: Date;
  /** The last update date of the account. */
  updatedAt: Date;
  /** An optional platform-specific ID. */
  platformId?: string;
}

/**
 * Represents a single financial activity, such as a trade or a deposit.
 */
export interface Activity {
  /** The unique ID of the activity. */
  id: string;
  /** The type of the activity. */
  type: ActivityType;
  /** The date of the activity. */
  date: Date | string;
  /** The quantity of the asset involved in the activity. */
  quantity: number;
  /** The price per unit of the asset. */
  unitPrice: number;
  /** The currency of the activity. */
  currency: string;
  /** Any fees associated with the activity. */
  fee: number;
  /** Whether the activity is a draft. */
  isDraft: boolean;
  /** An optional comment for the activity. */
  comment?: string | null;
  /** The ID of the account this activity belongs to. */
  accountId?: string | null;
  /** The creation date of the activity. */
  createdAt: Date | string;
  /** The ID of the symbol profile associated with this activity. */
  symbolProfileId: string;
  /** The last update date of the activity. */
  updatedAt: Date | string;
}

/**
 * Represents the detailed view of an activity, including related account and asset information.
 */
export interface ActivityDetails {
  /** The unique ID of the activity. */
  id: string;
  /** The type of the activity. */
  activityType: ActivityType;
  /** The date of the activity. */
  date: Date;
  /** The quantity of the asset involved in the activity. */
  quantity: number;
  /** The price per unit of the asset. */
  unitPrice: number;
  /** The total amount of the activity. */
  amount: number;
  /** Any fees associated with the activity. */
  fee: number;
  /** The currency of the activity. */
  currency: string;
  /** Whether the activity is a draft. */
  isDraft: boolean;
  /** An optional comment for the activity. */
  comment?: string;
  /** The creation date of the activity. */
  createdAt: Date;
  /** The ID of the asset involved in the activity. */
  assetId: string;
  /** The last update date of the activity. */
  updatedAt: Date;
  /** The ID of the account this activity belongs to. */
  accountId: string;
  /** The name of the account. */
  accountName: string;
  /** The currency of the account. */
  accountCurrency: string;
  /** The symbol of the asset. */
  assetSymbol: string;
  /** The name of the asset. */
  assetName?: string;
  /** The data source for the asset's market data. */
  assetDataSource?: DataSource;
  /** Any sub-rows for this activity, used for things like stock splits. */
  subRows?: ActivityDetails[];
}

/**
 * The response from an activity search, including the data and metadata about the total number of rows.
 */
export interface ActivitySearchResponse {
  /** The activity data for the current page. */
  data: ActivityDetails[];
  /** Metadata about the search results. */
  meta: {
    /** The total number of rows matching the search criteria. */
    totalRowCount: number;
  };
}

/**
 * The data required to create a new activity.
 */
export interface ActivityCreate {
  /** An optional temporary ID for the activity. */
  id?: string;
  /** The ID of the account for this activity. */
  accountId: string;
  /** The type of the activity. */
  activityType: string;
  /** The date of the activity. */
  activityDate: string | Date;
  /** The ID of the asset involved in the activity. */
  assetId?: string;
  /** The quantity of the asset. */
  quantity?: number;
  /** The price per unit of the asset. */
  unitPrice?: number;
  /** The total amount of the activity. */
  amount?: number;
  /** The currency of the activity. */
  currency?: string;
  /** Any fees associated with the activity. */
  fee?: number;
  /** Whether the activity is a draft. */
  isDraft: boolean;
  /** An optional comment for the activity. */
  comment?: string | null;
}

/**
 * The data required to update an existing activity.
 */
export interface ActivityUpdate extends ActivityCreate {
  /** The unique ID of the activity to update. */
  id: string;
}

/**
 * A request to perform a bulk mutation of activities, including creates, updates, and deletes.
 */
export interface ActivityBulkMutationRequest {
  /** A list of activities to create. */
  creates?: ActivityCreate[];
  /** A list of activities to update. */
  updates?: ActivityUpdate[];
  /** A list of activity IDs to delete. */
  deleteIds?: string[];
}

/**
 * An error that occurred during a bulk mutation of activities.
 */
export interface ActivityBulkMutationError {
  /** The ID of the activity that caused the error. */
  id?: string;
  /** The action that failed (e.g., 'create', 'update', 'delete'). */
  action: string;
  /** The error message. */
  message: string;
}

/**
 * A mapping from a temporary ID to the permanent ID of a created activity.
 */
export interface ActivityBulkIdentifierMapping {
  /** The temporary ID used in the creation request. */
  tempId?: string | null;
  /** The permanent ID assigned to the created activity. */
  activityId: string;
}

/**
 * The result of a bulk mutation of activities.
 */
export interface ActivityBulkMutationResult {
  /** A list of the created activities. */
  created: Activity[];
  /** A list of the updated activities. */
  updated: Activity[];
  /** A list of the deleted activities. */
  deleted: Activity[];
  /** A list of mappings from temporary IDs to permanent IDs for the created activities. */
  createdMappings: ActivityBulkIdentifierMapping[];
  /** A list of any errors that occurred during the bulk mutation. */
  errors: ActivityBulkMutationError[];
}

/**
 * Represents an activity that is being imported from a file.
 */
export interface ActivityImport {
  /** An optional ID for the activity. */
  id?: string;
  /** The ID of the account for this activity. */
  accountId: string;
  /** The currency of the activity. */
  currency?: string;
  /** The type of the activity. */
  activityType: ActivityType;
  /** The date of the activity. */
  date?: Date | string;
  /** The symbol of the asset. */
  symbol: string;
  /** The total amount of the activity. */
  amount?: number;
  /** The quantity of the asset. */
  quantity?: number;
  /** The price per unit of the asset. */
  unitPrice?: number;
  /** Any fees associated with the activity. */
  fee?: number;
  /** The name of the account. */
  accountName?: string;
  /** The name of the symbol. */
  symbolName?: string;
  /** Any validation errors for this activity. */
  errors?: Record<string, string[]>;
  /** Whether the activity data is valid. */
  isValid: boolean;
  /** The line number from the source file. */
  lineNumber?: number;
  /** Whether the activity is a draft. */
  isDraft: boolean;
  /** An optional comment for the activity. */
  comment?: string;
}

/**
 * Represents the mapping data for importing activities from a file.
 */
export interface ImportMappingData {
  /** The ID of the account this mapping is for. */
  accountId: string;
  /** A map of CSV headers to activity fields. */
  fieldMappings: Record<string, string>;
  /** A map of activity types to their corresponding values in the CSV. */
  activityMappings: Record<string, string[]>;
  /** A map of symbols to their corresponding values in the CSV. */
  symbolMappings: Record<string, string>;
  /** A map of accounts to their corresponding values in the CSV. */
  accountMappings: Record<string, string>;
}

/**
 * Represents the profile of an asset.
 */
export interface AssetProfile {
  /** The unique ID of the asset profile. */
  id: string;
  /** The ISIN of the asset. */
  isin: string | null;
  /** The name of the asset. */
  name: string | null;
  /** The type of the asset (e.g., 'STOCK', 'ETF'). */
  assetType: string | null;
  /** The symbol of the asset. */
  symbol: string;
  /** An optional mapping for the symbol. */
  symbolMapping: string | null;
  /** The asset class (e.g., 'EQUITY', 'FIXED INCOME'). */
  assetClass: string | null;
  /** The asset sub-class. */
  assetSubClass: string | null;
  /** Any notes for the asset. */
  notes: string | null;
  /** The countries the asset is associated with. */
  countries: string | null;
  /** The categories of the asset. */
  categories: string | null;
  /** The classes of the asset. */
  classes: string | null;
  /** Any additional attributes of the asset. */
  attributes: string | null;
  /** The creation date of the asset profile. */
  createdAt: Date;
  /** The currency of the asset. */
  currency: string;
  /** The data source for the asset's market data. */
  dataSource: string;
  /** The last update date of the asset profile. */
  updatedAt: Date;
  /** The sectors the asset belongs to. */
  sectors: string | null;
  /** An optional URL for the asset. */
  url: string | null;
}

/**
 * A summary of a quote for a specific symbol, typically from a search result.
 */
export interface QuoteSummary {
  /** The exchange the symbol trades on. */
  exchange: string;
  /** A short name for the symbol. */
  shortName: string;
  /** The type of the quote (e.g., 'EQUITY', 'INDEX'). */
  quoteType: string;
  /** The symbol. */
  symbol: string;
  /** The index of the symbol. */
  index: string;
  /** A score indicating the relevance of the search result. */
  score: number;
  /** A display-friendly type name. */
  typeDisplay: string;
  /** A long name for the symbol. */
  longName: string;
  /** The sector of the symbol. */
  sector?: string;
  /** The industry of the symbol. */
  industry?: string;
  /** Whether the data source is available. */
  dataSource?: boolean;
}

/**
 * Information about a market data provider.
 */
export interface MarketDataProviderInfo {
  /** The unique ID of the provider. */
  id: string;
  /** The name of the provider. */
  name: string;
  /** The filename of the provider's logo. */
  logoFilename: string;
  /** The last time data was synced from this provider. */
  lastSyncedDate: string | null;
}

/**
 * Represents a single data point of market data for a symbol.
 */
export interface MarketData {
  /** The creation date of the data point. */
  createdAt: Date;
  /** The source of the data. */
  dataSource: string;
  /** The date of the data point. */
  date: Date;
  /** The unique ID of the data point. */
  id: string;
  /** The market price at the time of the data point. */
  marketPrice: number;
  /** The state of the market (e.g., 'CLOSE'). */
  state: 'CLOSE';
  /** The symbol the data is for. */
  symbol: string;
  /** The ID of the symbol profile. */
  symbolProfileId: string;
}

/**
 * Represents a tag that can be associated with an activity.
 */
export interface Tag {
  /** The unique ID of the tag. */
  id: string;
  /** The name of the tag. */
  name: string;
  /** The ID of the activity the tag is associated with. */
  activityId: string | null;
}

/**
 * The result of validating an import file.
 */
export interface ImportValidationResult {
  /** A list of the activities from the import file, with validation errors if any. */
  activities: ActivityImport[];
  /** A summary of the validation results. */
  validationSummary: {
    /** The total number of rows in the import file. */
    totalRows: number;
    /** The number of valid rows. */
    validCount: number;
    /** The number of invalid rows. */
    invalidCount: number;
  };
}

export type ValidationResult =
  | { status: 'success' }
  | { status: 'error'; errors: string[] };

/**
 * Represents a sector with a name and a weight.
 */
export interface Sector {
  /** The name of the sector. */
  name: string;
  /** The weight of the sector in a portfolio or asset. */
  weight: number;
}

/**
 * Represents a country with a name and a weight.
 */
export interface Country {
  /** The name of the country. */
  name: string;
  /** The weight of the country in a portfolio or asset. */
  weight: number;
}

/**
 * Represents a financial instrument, such as a stock or an ETF.
 */
export interface Instrument {
  /** The unique ID of the instrument. */
  id: string;
  /** The symbol of the instrument. */
  symbol: string;
  /** The name of the instrument. */
  name?: string | null;
  /** The currency of the instrument. */
  currency: string;
  /** Any notes for the instrument. */
  notes?: string | null;
  /** The data source for the instrument's market data. */
  dataSource?: string | null;
  /** The asset class of the instrument. */
  assetClass?: string | null;
  /** The asset sub-class of the instrument. */
  assetSubclass?: string | null;
  /** A list of countries associated with the instrument. */
  countries?: Country[] | null;
  /** A list of sectors associated with the instrument. */
  sectors?: Sector[] | null;
}

/**
 * Represents a monetary value in both local and base currencies.
 */
export interface MonetaryValue {
  /** The value in the local currency. */
  local: number;
  /** The value in the base currency. */
  base: number;
}

/**
 * Represents a lot of a security, which is a group of shares bought at the same time.
 */
export interface Lot {
  /** The unique ID of the lot. */
  id: string;
  /** The ID of the position this lot belongs to. */
  positionId: string;
  /** The date the lot was acquired. */
  acquisitionDate: string;
  /** The quantity of shares in the lot. */
  quantity: number;
  /** The cost basis of the lot. */
  costBasis: number;
  /** The price per share at acquisition. */
  acquisitionPrice: number;
  /** Any fees associated with the acquisition. */
  acquisitionFees: number;
}

/**
 * Represents a position in a specific asset within an account.
 */
export interface Position {
  /** The unique ID of the position. */
  id:string;
  /** The ID of the account this position belongs to. */
  accountId: string;
  /** The ID of the asset. */
  assetId: string;
  /** The total quantity of the asset held. */
  quantity: number;
  /** The average cost per share of the asset. */
  averageCost: number;
  /** The total cost basis of the position. */
  totalCostBasis: number;
  /** The currency of the position. */
  currency: string;
  /** The date the position was opened. */
  inceptionDate: string;
  /** A list of lots that make up this position. */
  lots: Lot[];
}

/**
 * Represents a holding of cash in an account.
 */
export interface CashHolding {
  /** The unique ID of the cash holding. */
  id: string;
  /** The ID of the account this cash holding belongs to. */
  accountId: string;
  /** The currency of the cash holding. */
  currency: string;
  /** The amount of cash. */
  amount: number;
  /** The last time the cash holding was updated. */
  lastUpdated: string;
}

/**
 * Represents a holding of an asset in an account.
 */
export interface Holding {
  /** The unique ID of the holding. */
  id: string;
  /** The type of the holding (cash or security). */
  holdingType: HoldingType;
  /** The ID of the account this holding belongs to. */
  accountId: string;
  /** The financial instrument of the holding. */
  instrument?: Instrument | null;
  /** The quantity of the asset held. */
  quantity: number;
  /** The date the holding was opened. */
  openDate?: string | Date | null;
  /** A list of lots that make up this holding. */
  lots?: Lot[] | null;
  /** The local currency of the holding. */
  localCurrency: string;
  /** The base currency of the application. */
  baseCurrency: string;
  /** The exchange rate from the local currency to the base currency. */
  fxRate?: number | null;
  /** The market value of the holding. */
  marketValue: MonetaryValue;
  /** The cost basis of the holding. */
  costBasis?: MonetaryValue | null;
  /** The current price of the asset. */
  price?: number | null;
  /** The unrealized gain or loss of the holding. */
  unrealizedGain?: MonetaryValue | null;
  /** The unrealized gain or loss as a percentage. */
  unrealizedGainPct?: number | null;
  /** The realized gain or loss of the holding. */
  realizedGain?: MonetaryValue | null;
  /** The realized gain or loss as a percentage. */
  realizedGainPct?: number | null;
  /** The total gain or loss of the holding. */
  totalGain?: MonetaryValue | null;
  /** The total gain or loss as a percentage. */
  totalGainPct?: number | null;
  /** The change in value for the current day. */
  dayChange?: MonetaryValue | null;
  /** The change in value for the current day as a percentage. */
  dayChangePct?: number | null;
  /** The value at the previous day's close. */
  prevCloseValue?: MonetaryValue | null;
  /** The weight of the holding in the portfolio. */
  weight: number;
  /** The date the holding data is as of. */
  asOfDate: string;
}

/**
 * Represents an asset, which is a financial instrument that can be held in a portfolio.
 */
export interface Asset {
  /** The unique ID of the asset. */
  id: string;
  /** The ISIN of the asset. */
  isin?: string | null;
  /** The name of the asset. */
  name?: string | null;
  /** The type of the asset (e.g., 'STOCK', 'ETF'). */
  assetType?: string | null;
  /** The symbol of the asset. */
  symbol: string;
  /** An optional mapping for the symbol. */
  symbolMapping?: string | null;
  /** The asset class (e.g., 'EQUITY', 'FIXED INCOME'). */
  assetClass?: string | null;
  /** The asset sub-class. */
  assetSubClass?: string | null;
  /** Any notes for the asset. */
  notes?: string | null;
  /** The countries the asset is associated with. */
  countries?: string | null;
  /** The categories of the asset. */
  categories?: string | null;
  /** The classes of the asset. */
  classes?: string | null;
  /** Any additional attributes of the asset. */
  attributes?: string | null;
  /** The creation date of the asset. */
  createdAt: string;
  /** The last update date of the asset. */
  updatedAt: string;
  /** The currency of the asset. */
  currency: string;
  /** The data source for the asset's market data. */
  dataSource: string;
  /** The sectors the asset belongs to. */
  sectors?: string | null;
  /** An optional URL for the asset. */
  url?: string | null;
}

/**
 * Represents a single quote for a symbol at a specific point in time.
 */
export interface Quote {
  /** The unique ID of the quote. */
  id: string;
  /** The creation date of the quote. */
  createdAt: string;
  /** The source of the data. */
  dataSource: string;
  /** The timestamp of the quote. */
  timestamp: string;
  /** The symbol the quote is for. */
  symbol: string;
  /** The opening price. */
  open: number;
  /** The highest price during the period. */
  high: number;
  /** The lowest price during the period. */
  low: number;
  /** The trading volume. */
  volume: number;
  /** The closing price. */
  close: number;
  /** The adjusted closing price. */
  adjclose: number;
  /** The currency of the quote. */
  currency: string;
}

/**
 * The data required to update a quote.
 */
export interface QuoteUpdate {
  /** The timestamp of the quote. */
  timestamp: string;
  /** The symbol of the quote. */
  symbol: string;
  /** The opening price. */
  open: number;
  /** The highest price. */
  high: number;
  /** The lowest price. */
  low: number;
  /** The trading volume. */
  volume: number;
  /** The closing price. */
  close: number;
  /** The data source. */
  dataSource: string;
}

/**
 * The application settings.
 */
export interface Settings {
  /** The color theme of the application. */
  theme: string;
  /** The font used in the application. */
  font: string;
  /** The base currency for all calculations. */
  baseCurrency: string;
  /** Whether the onboarding process has been completed. */
  onboardingCompleted: boolean;
  /** Whether the auto-update check is enabled. */
  autoUpdateCheckEnabled: boolean;
}

/**
 * The context for the settings provider.
 */
export interface SettingsContextType {
  /** The current settings. */
  settings: Settings | null;
  /** Whether the settings are currently being loaded. */
  isLoading: boolean;
  /** Whether there was an error loading the settings. */
  isError: boolean;
  /** A function to update the base currency. */
  updateBaseCurrency: (currency: Settings['baseCurrency']) => Promise<void>;
  /** Whether accounts should be grouped. */
  accountsGrouped: boolean;
  /** A function to set whether accounts should be grouped. */
  setAccountsGrouped: (value: boolean) => void;
}

/**
 * Represents a financial goal.
 */
export interface Goal {
  /** The unique ID of the goal. */
  id: string;
  /** The title of the goal. */
  title: string;
  /** An optional description of the goal. */
  description?: string;
  /** The target amount for the goal. */
  targetAmount: number;
  /** Whether the goal has been achieved. */
  isAchieved?: boolean;
  /** A list of account allocations for this goal. */
  allocations?: GoalAllocation[];
}

/**
 * Represents the allocation of an account to a goal.
 */
export interface GoalAllocation {
  /** The unique ID of the allocation. */
  id: string;
  /** The ID of the goal. */
  goalId: string;
  /** The ID of the account. */
  accountId: string;
  /** The percentage of the account allocated to the goal. */
  percentAllocation: number;
}

/**
 * Represents the progress towards a financial goal.
 */
export interface GoalProgress {
  /** The name of the goal. */
  name: string;
  /** The target value of the goal. */
  targetValue: number;
  /** The current value of the goal. */
  currentValue: number;
  /** The progress towards the goal as a percentage. */
  progress: number;
  /** The currency of the goal. */
  currency: string;
}

/**
 * A summary of income over a period of time.
 */
export interface IncomeSummary {
  /** The period the summary is for (e.g., '2023'). */
  period: string;
  /** A breakdown of income by month. */
  byMonth: Record<string, number>;
  /** A breakdown of income by type. */
  byType: Record<string, number>;
  /** A breakdown of income by symbol. */
  bySymbol: Record<string, number>;
  /** A breakdown of income by currency. */
  byCurrency: Record<string, number>;
  /** The total income for the period. */
  totalIncome: number;
  /** The currency of the income summary. */
  currency: string;
  /** The average monthly income. */
  monthlyAverage: number;
  /** The year-over-year growth in income. */
  yoyGrowth: number | null;
}

/**
 * A date range with a start and end date.
 */
export interface DateRange {
  /** The start date of the range. */
  from: Date | undefined;
  /** The end date of the range. */
  to: Date | undefined;
}

/**
 * A set of predefined time periods for filtering data.
 */
export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';

/**
 * Represents the valuation of an account at a specific point in time.
 */
export interface AccountValuation {
  /** The unique ID of the valuation. */
  id: string;
  /** The ID of the account. */
  accountId: string;
  /** The date of the valuation. */
  valuationDate: string;
  /** The currency of the account. */
  accountCurrency: string;
  /** The base currency of the application. */
  baseCurrency: string;
  /** The exchange rate from the account currency to the base currency. */
  fxRateToBase: number;
  /** The cash balance of the account. */
  cashBalance: number;
  /** The market value of the investments in the account. */
  investmentMarketValue: number;
  /** The total value of the account. */
  totalValue: number;
  /** The cost basis of the investments in the account. */
  costBasis: number;
  /** The net contributions to the account. */
  netContribution: number;
  /** The date the valuation was calculated. */
  calculatedAt: string;
}

/**
 * A summary view of an account, including its performance.
 */
export interface AccountSummaryView {
  /** The ID of the account. */
  accountId: string;
  /** The name of the account. */
  accountName: string;
  /** The type of the account. */
  accountType: string;
  /** The group the account belongs to. */
  accountGroup: string | null;
  /** The currency of the account. */
  accountCurrency: string;
  /** The total value of the account in its own currency. */
  totalValueAccountCurrency: number;
  /** The total value of the account in the base currency. */
  totalValueBaseCurrency: number;
  /** The base currency of the application. */
  baseCurrency: string;
  /** The simple performance metrics for the account. */
  performance: SimplePerformanceMetrics;
}

/**
 * A set of simple performance metrics for an account.
 */
export interface SimplePerformanceMetrics {
  /** The ID of the account. */
  accountId: string;
  /** The total value of the account. */
  totalValue?: number | null;
  /** The currency of the account. */
  accountCurrency?: string | null;
  /** The base currency of the application. */
  baseCurrency?: string | null;
  /** The exchange rate to the base currency. */
  fxRateToBase?: number | null;
  /** The total gain or loss. */
  totalGainLossAmount?: number | null;
  /** The cumulative return as a percentage. */
  cumulativeReturnPercent?: number | null;
  /** The gain or loss for the current day. */
  dayGainLossAmount?: number | null;
  /** The return for the current day, calculated using the Modified Dietz method. */
  dayReturnPercentModDietz?: number | null;
  /** The weight of the account in the portfolio. */
  portfolioWeight?: number | null;
}

/**
 * A group of accounts, with aggregated performance metrics.
 */
export interface AccountGroup {
  /** The name of the group. */
  groupName: string;
  /** The accounts in the group. */
  accounts: AccountSummaryView[];
  /** The total value of the group in the base currency. */
  totalValueBaseCurrency: number;
  /** The base currency of the application. */
  baseCurrency: string;
  /** The aggregated performance metrics for the group. */
  performance: SimplePerformanceMetrics;
  /** The number of accounts in the group. */
  accountCount: number;
}

/**
 * Represents an exchange rate between two currencies.
 */
export interface ExchangeRate {
  /** The unique ID of the exchange rate. */
  id: string;
  /** The currency to convert from. */
  fromCurrency: string;
  /** The currency to convert to. */
  toCurrency: string;
  /** The name of the 'from' currency. */
  fromCurrencyName?: string;
  /** The name of the 'to' currency. */
  toCurrencyName?: string;
  /** The exchange rate. */
  rate: number;
  /** The source of the exchange rate data. */
  source: string;
  /** Whether the exchange rate is currently being loaded. */
  isLoading?: boolean;
  /** The timestamp of the exchange rate. */
  timestamp: string;
}

/**
 * Represents a contribution limit for a specific year.
 */
export interface ContributionLimit {
  /** The unique ID of the contribution limit. */
  id: string;
  /** The name of the group this limit belongs to. */
  groupName: string;
  /** The year the contribution limit applies to. */
  contributionYear: number;
  /** The amount of the contribution limit. */
  limitAmount: number;
  /** A comma-separated list of account IDs this limit applies to. */
  accountIds?: string | null;
  /** The start date of the contribution period. */
  startDate?: string | null;
  /** The end date of the contribution period. */
  endDate?: string | null;
  /** The creation date of the contribution limit. */
  createdAt?: string;
  /** The last update date of the contribution limit. */
  updatedAt?: string;
}

/**
 * The data required to create a new contribution limit.
 */
export type NewContributionLimit = Omit<
  ContributionLimit,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Represents a deposit into an account, with its value in both the local and base currencies.
 */
export interface AccountDeposit {
  /** The amount of the deposit in the local currency. */
  amount: number;
  /** The currency of the deposit. */
  currency: string;
  /** The amount of the deposit converted to the base currency. */
  convertedAmount: number;
}

/**
 * The result of a calculation of deposits for a contribution limit.
 */
export interface DepositsCalculation {
  /** The total amount of deposits in the base currency. */
  total: number;
  /** The base currency. */
  baseCurrency: string;
  /** A breakdown of deposits by account. */
  byAccount: Record<string, AccountDeposit>;
}

/** The length of the prefix for activity types. */
export const ACTIVITY_TYPE_PREFIX_LENGTH = 12;

/**
 * Represents a single data point in a series of returns.
 */
export interface ReturnData {
  /** The date of the data point. */
  date: string;
  /** The value at that date. */
  value: number;
}

/**
 * A set of performance metrics for a portfolio, account, or asset.
 */
export interface PerformanceMetrics {
  /** The unique ID of the item these metrics are for. */
  id: string;
  /** A series of returns over time. */
  returns: ReturnData[];
  /** The start date of the performance period. */
  periodStartDate?: string | null;
  /** The end date of the performance period. */
  periodEndDate?: string | null;
  /** The currency of the metrics. */
  currency: string;
  /** The cumulative Time-Weighted Return. */
  cumulativeTwr: number;
  /** The total gain or loss in monetary terms. */
  gainLossAmount?: number | null;
  /** The annualized Time-Weighted Return. */
  annualizedTwr: number;
  /** The simple return over the period. */
  simpleReturn: number;
  /** The annualized simple return. */
  annualizedSimpleReturn: number;
  /** The cumulative Money-Weighted Return. */
  cumulativeMwr: number;
  /** The annualized Money-Weighted Return. */
  annualizedMwr: number;
  /** The volatility of the returns. */
  volatility: number;
  /** The maximum drawdown over the period. */
  maxDrawdown: number;
}

/**
 * The data required to update an asset's profile.
 */
export interface UpdateAssetProfile {
  /** The symbol of the asset. */
  symbol: string;
  /** The name of the asset. */
  name?: string;
  /** The sectors the asset belongs to. */
  sectors: string;
  /** The countries the asset is associated with. */
  countries: string;
  /** Any notes for the asset. */
  notes: string;
  /** The asset class. */
  assetClass: string;
  /** The asset sub-class. */
  assetSubClass: string;
}

/**
 * Represents an item that can be tracked for performance, either an account or a symbol.
 */
export interface TrackedItem {
  /** The unique ID of the item. */
  id: string;
  /** The type of the item. */
  type: 'account' | 'symbol';
  /** The name of the item. */
  name: string;
}
