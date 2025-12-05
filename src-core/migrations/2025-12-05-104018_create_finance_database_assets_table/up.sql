-- Table to store FinanceDatabase asset metadata (ETFs, Funds, Cryptos)
CREATE TABLE finance_database_assets (
    id TEXT PRIMARY KEY NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL, -- 'ETF', 'FUND', 'CRYPTO'
    currency TEXT NOT NULL,
    summary TEXT,
    category_group TEXT,
    category TEXT,
    family TEXT,
    exchange TEXT,
    cryptocurrency TEXT, -- Only for crypto assets (base currency)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast symbol lookups
CREATE INDEX idx_finance_db_symbol ON finance_database_assets(symbol);

-- Index for fast name searches (case-insensitive)
CREATE INDEX idx_finance_db_name ON finance_database_assets(name COLLATE NOCASE);

-- Index for filtering by asset type
CREATE INDEX idx_finance_db_type ON finance_database_assets(asset_type);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_finance_db_symbol_type ON finance_database_assets(symbol, asset_type);
