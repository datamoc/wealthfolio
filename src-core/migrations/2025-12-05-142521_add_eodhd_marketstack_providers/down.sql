-- Remove EODHD and MarketStack providers
DELETE FROM market_data_providers WHERE id IN ('EODHD', 'MARKETSTACK');
