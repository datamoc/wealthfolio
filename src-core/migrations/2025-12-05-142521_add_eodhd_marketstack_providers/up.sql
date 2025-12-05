-- Add EODHD and MarketStack as new market data providers
INSERT INTO market_data_providers (id, name, description, url, priority, enabled, logo_filename, last_synced_at, last_sync_status, last_sync_error)
VALUES
    ('EODHD', 'EODHD', 'EOD Historical Data provides comprehensive financial data including historical and real-time stock prices, fundamentals, and more for global markets.', 'https://eodhistoricaldata.com/', 4, FALSE, 'eodhd.png', NULL, NULL, NULL),
    ('MARKETSTACK', 'MarketStack', 'MarketStack offers real-time and historical stock market data for global exchanges with a simple REST API interface.', 'https://marketstack.com/', 5, FALSE, 'marketstack.png', NULL, NULL, NULL);
