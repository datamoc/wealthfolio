use std::sync::Arc;

use crate::context::ServiceContext;

use log::{debug, error};
use tauri::State;
use wealthfolio_core::finance_database::FinanceDatabaseSearchResult;

#[tauri::command]
pub async fn search_finance_database(
    query: String,
    limit: Option<i64>,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<FinanceDatabaseSearchResult>, String> {
    debug!("Searching FinanceDatabase for: {}", query);
    let search_limit = limit.unwrap_or(20);

    state
        .finance_database_service()
        .search(&query, search_limit)
        .map_err(|e| {
            error!("Failed to search FinanceDatabase: {}", e);
            format!("Failed to search: {}", e)
        })
}

#[tauri::command]
pub async fn import_finance_database_csv(
    csv_path: String,
    asset_type: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<usize, String> {
    debug!(
        "Importing FinanceDatabase CSV: {} (type: {})",
        csv_path, asset_type
    );

    let result = match asset_type.to_uppercase().as_str() {
        "ETF" => state
            .finance_database_service()
            .import_etfs(&csv_path)
            .map_err(|e| format!("Failed to import ETFs: {}", e)),
        "FUND" => state
            .finance_database_service()
            .import_funds(&csv_path)
            .map_err(|e| format!("Failed to import Funds: {}", e)),
        "CRYPTO" => state
            .finance_database_service()
            .import_cryptos(&csv_path)
            .map_err(|e| format!("Failed to import Cryptos: {}", e)),
        _ => Err(format!(
            "Invalid asset type: {}. Must be ETF, FUND, or CRYPTO",
            asset_type
        )),
    };

    result.map(|count| {
        debug!("Successfully imported {} assets", count);
        count
    })
}

#[tauri::command]
pub async fn get_finance_database_stats(
    state: State<'_, Arc<ServiceContext>>,
) -> Result<FinanceDatabaseStats, String> {
    debug!("Getting FinanceDatabase statistics");

    let total = state
        .finance_database_service()
        .count()
        .map_err(|e| e.to_string())?;

    let etf_count = state
        .finance_database_service()
        .count_by_type("ETF")
        .map_err(|e| e.to_string())?;

    let fund_count = state
        .finance_database_service()
        .count_by_type("FUND")
        .map_err(|e| e.to_string())?;

    let crypto_count = state
        .finance_database_service()
        .count_by_type("CRYPTO")
        .map_err(|e| e.to_string())?;

    Ok(FinanceDatabaseStats {
        total,
        etf_count,
        fund_count,
        crypto_count,
    })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceDatabaseStats {
    pub total: i64,
    pub etf_count: i64,
    pub fund_count: i64,
    pub crypto_count: i64,
}
