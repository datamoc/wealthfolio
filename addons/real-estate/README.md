# Real Estate Tracker Addon

A comprehensive addon for Wealthfolio to track real estate properties and their associated loans/mortgages.

## Features

- **Property Management**: Track multiple properties with detailed information
- **Loan Tracking**: Manage mortgages and loans associated with each property
- **Equity Calculation**: Automatically calculate equity (property value - loan balance)
- **Portfolio Summary**: View total value, equity, and appreciation across all properties
- **Property Types**: Support for residential, commercial, rental, vacation homes, and more
- **Loan Types**: Track fixed, variable, ARM, interest-only, and home equity loans
- **Search & Filter**: Easily find properties by name, address, or type

## Installation

This addon comes bundled with Wealthfolio. To enable it:

1. Open Wealthfolio
2. Navigate to Settings > Addons
3. Find "Real Estate Tracker" in the list
4. Toggle it to enable

## Usage

### Adding a Property

1. Click the "Add Property" button
2. Fill in the property details:
   - Name and type
   - Address information
   - Purchase date and price
   - Current valuation
   - Currency
3. Click "Add Property" to save

### Managing Loans

1. Find the property card
2. Click "Add Loan" to add a mortgage or loan
3. Fill in loan details:
   - Loan name and type
   - Lender information
   - Original amount and current balance
   - Interest rate and payment details
   - Start and maturity dates
4. View all loans by clicking "View Details" in the Loans section

### Portfolio Overview

The dashboard displays:
- Total number of properties
- Total portfolio value with appreciation
- Total equity across all properties
- Individual property cards with key metrics

### Property Metrics

Each property card shows:
- Current value and equity
- Purchase price and date
- Total appreciation (amount and percentage)
- Loan balance and monthly payments
- Number of associated loans

## Data Storage

All data is stored locally using Wealthfolio's storage API. Your property and loan information never leaves your device.

## Permissions

This addon requires the following permissions:
- **Storage**: To save and retrieve property and loan data
- **UI**: To add navigation items and pages

## Development

### Building

```bash
pnpm install
pnpm build
```

### Development Mode

```bash
# In one terminal, start the addon dev server
pnpm dev:server

# In another terminal, start Wealthfolio
cd ../..
pnpm tauri dev
```

## License

MIT License - Part of the Wealthfolio project

## Support

For issues or feature requests, please visit: https://github.com/afadil/wealthfolio/issues
