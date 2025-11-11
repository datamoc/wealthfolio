-- Drop indices
DROP INDEX IF EXISTS idx_reconciliation_discrepancies_status;
DROP INDEX IF EXISTS idx_reconciliation_discrepancies_session;
DROP INDEX IF EXISTS idx_reconciliation_items_symbol;
DROP INDEX IF EXISTS idx_reconciliation_items_session;
DROP INDEX IF EXISTS idx_reconciliation_sessions_date;
DROP INDEX IF EXISTS idx_reconciliation_sessions_account;

-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS reconciliation_discrepancies;
DROP TABLE IF EXISTS reconciliation_items;
DROP TABLE IF EXISTS reconciliation_sessions;
