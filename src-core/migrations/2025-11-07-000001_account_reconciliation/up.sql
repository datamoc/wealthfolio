-- Create reconciliation_sessions table
CREATE TABLE IF NOT EXISTS reconciliation_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    reconciliation_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, COMPLETED, CANCELLED
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Create reconciliation_items table (broker statement entries)
CREATE TABLE IF NOT EXISTS reconciliation_items (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity REAL NOT NULL,
    book_value REAL,  -- What user originally paid (optional)
    market_value REAL,  -- Current market value from broker
    currency TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES reconciliation_sessions(id) ON DELETE CASCADE
);

-- Create reconciliation_discrepancies table
CREATE TABLE IF NOT EXISTS reconciliation_discrepancies (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    asset_id TEXT,
    expected_quantity REAL NOT NULL,  -- From our system
    actual_quantity REAL NOT NULL,    -- From broker
    quantity_difference REAL NOT NULL,
    expected_book_value REAL,
    actual_book_value REAL,
    status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, RESOLVED, IGNORED
    resolution_activity_id TEXT,  -- Link to adjustment activity if created
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (resolution_activity_id) REFERENCES activities(id) ON DELETE SET NULL
);

-- Create indices for better query performance
CREATE INDEX idx_reconciliation_sessions_account ON reconciliation_sessions(account_id);
CREATE INDEX idx_reconciliation_sessions_date ON reconciliation_sessions(reconciliation_date);
CREATE INDEX idx_reconciliation_items_session ON reconciliation_items(session_id);
CREATE INDEX idx_reconciliation_items_symbol ON reconciliation_items(symbol);
CREATE INDEX idx_reconciliation_discrepancies_session ON reconciliation_discrepancies(session_id);
CREATE INDEX idx_reconciliation_discrepancies_status ON reconciliation_discrepancies(status);
