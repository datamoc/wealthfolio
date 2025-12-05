# FinanceDatabase Integration

This directory is for storing FinanceDatabase CSV files to enable searching and tracking of assets not available on Yahoo Finance.

## Supported Asset Types

Wealthfolio supports three types of FinanceDatabase assets:

- **ETFs** (`etfs.csv`)
- **Mutual Funds** (`funds.csv`)
- **Cryptocurrencies** (`cryptos.csv`)

## How to Get the CSV Files

1. Visit the [FinanceDatabase GitHub repository](https://github.com/JerBouma/FinanceDatabase)
2. Navigate to the `/database` directory
3. Download the CSV files you need:
   - `etfs.csv` - Exchange-Traded Funds
   - `funds.csv` - Mutual Funds
   - `cryptos.csv` - Cryptocurrencies

## File Placement

Place the downloaded CSV files in this directory:

```
data/finance-database/
├── etfs.csv       (optional)
├── funds.csv      (optional)
└── cryptos.csv    (optional)
```

You only need to download the asset types you want to track.

## Importing the Data

After placing the CSV files in this directory, you can import them using Wealthfolio's Settings or via command:

### Via Settings UI
1. Open Wealthfolio
2. Go to Settings → Data Sources → FinanceDatabase
3. Click "Import ETFs/Funds/Cryptos"
4. Select the CSV file to import

### Via Tauri Command (for developers)
```typescript
import { importFinanceDatabaseCsv } from '@/commands/finance-database';

// Import ETFs
await importFinanceDatabaseCsv('./data/finance-database/etfs.csv', 'ETF');

// Import Mutual Funds
await importFinanceDatabaseCsv('./data/finance-database/funds.csv', 'FUND');

// Import Cryptocurrencies
await importFinanceDatabaseCsv('./data/finance-database/cryptos.csv', 'CRYPTO');
```

## Updating the Data

To update the FinanceDatabase assets:

1. Download the latest CSV files from the FinanceDatabase repository
2. Replace the existing CSV files in this directory
3. Re-import using the steps above

The import process uses "upsert" logic (insert or update), so existing assets will be updated with new data.

## Using FinanceDatabase Assets

Once imported, FinanceDatabase assets will appear in the asset search results alongside Yahoo Finance results. Assets from FinanceDatabase:

- **Are searchable** by symbol or name
- **Can be added** to activities and portfolios
- **Require manual price updates** (they won't sync automatically like Yahoo Finance assets)
- **Are labeled** with `FINANCE_DATABASE` as the data source

### Manual Price Management

Since FinanceDatabase doesn't provide real-time pricing data:

1. Add the asset to an activity
2. Go to Market Data → Quotes
3. Add historical price points manually
4. Or import prices via CSV

## Benefits

- **Broader Asset Coverage**: Track assets not available on Yahoo Finance
- **Metadata Rich**: Includes category, family, exchange, and summary information
- **Local-First**: All data stored locally, no external API dependencies
- **Privacy**: No tracking or data sharing with external services

## File Sizes

Note that FinanceDatabase CSV files can be large:
- `etfs.csv`: ~36,000 assets
- `funds.csv`: ~57,000 assets
- `cryptos.csv`: ~3,300 assets

Initial import may take a few minutes depending on file size.

## Troubleshooting

**Import fails**: Ensure the CSV file format matches FinanceDatabase's structure:
- ETFs/Funds: `symbol,name,currency,summary,category_group,category,family,exchange`
- Cryptos: `symbol,name,cryptocurrency,currency,summary,exchange`

**Asset not found**: Verify the CSV was imported successfully by checking the stats in Settings.

**Duplicate symbols**: If an asset exists in both Yahoo Finance and FinanceDatabase, Yahoo Finance takes precedence for price syncing.

## Contributing

If you find issues with FinanceDatabase data, please report them to the [FinanceDatabase repository](https://github.com/JerBouma/FinanceDatabase/issues).
