use std::path::Path;
use std::sync::Arc;

use csv::ReaderBuilder;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use serde::Deserialize;

use crate::errors::{Result, ValidationError};
use crate::schema::finance_database_assets;
use crate::Error;

use super::finance_database_model::{
    FinanceDatabaseAsset, FinanceDatabaseSearchResult, NewFinanceDatabaseAsset,
};

/// CSV record structure for ETFs and Funds
#[derive(Debug, Deserialize)]
struct EtfFundCsvRecord {
    symbol: String,
    name: String,
    currency: String,
    summary: Option<String>,
    category_group: Option<String>,
    category: Option<String>,
    family: Option<String>,
    exchange: Option<String>,
}

/// CSV record structure for Cryptocurrencies
#[derive(Debug, Deserialize)]
struct CryptoCsvRecord {
    symbol: String,
    name: String,
    cryptocurrency: String,
    currency: String,
    summary: Option<String>,
    exchange: Option<String>,
}

pub struct FinanceDatabaseService {
    pool: Arc<Pool<ConnectionManager<SqliteConnection>>>,
}

impl FinanceDatabaseService {
    pub fn new(pool: Arc<Pool<ConnectionManager<SqliteConnection>>>) -> Self {
        Self { pool }
    }

    /// Import ETFs from CSV file
    pub fn import_etfs<P: AsRef<Path>>(&self, csv_path: P) -> Result<usize> {
        self.import_etf_fund_csv(csv_path, "ETF")
    }

    /// Import Mutual Funds from CSV file
    pub fn import_funds<P: AsRef<Path>>(&self, csv_path: P) -> Result<usize> {
        self.import_etf_fund_csv(csv_path, "FUND")
    }

    /// Import Cryptocurrencies from CSV file
    pub fn import_cryptos<P: AsRef<Path>>(&self, csv_path: P) -> Result<usize> {
        let path = csv_path.as_ref();
        if !path.exists() {
            return Err(Error::Validation(ValidationError::InvalidInput(
                format!("CSV file not found: {}", path.display()),
            )));
        }

        let mut reader = ReaderBuilder::new()
            .has_headers(true)
            .flexible(true)
            .from_path(path)
            .map_err(|e| {
                Error::Validation(ValidationError::InvalidInput(format!(
                    "Failed to read CSV: {}",
                    e
                )))
            })?;

        let mut assets_to_insert = Vec::new();

        for result in reader.deserialize() {
            let record: CryptoCsvRecord = result.map_err(|e| {
                Error::Validation(ValidationError::InvalidInput(format!(
                    "Failed to parse CSV record: {}",
                    e
                )))
            })?;

            let new_asset = NewFinanceDatabaseAsset::from_csv_record(
                record.symbol,
                record.name,
                "CRYPTO".to_string(),
                record.currency,
                record.summary,
                None, // category_group not applicable for cryptos
                None, // category not applicable for cryptos
                None, // family not applicable for cryptos
                record.exchange,
                Some(record.cryptocurrency),
            );

            assets_to_insert.push(new_asset);
        }

        self.batch_insert_assets(assets_to_insert)
    }

    /// Internal method to import ETF/Fund CSV files
    fn import_etf_fund_csv<P: AsRef<Path>>(
        &self,
        csv_path: P,
        asset_type: &str,
    ) -> Result<usize> {
        let path = csv_path.as_ref();
        if !path.exists() {
            return Err(Error::Validation(ValidationError::InvalidInput(
                format!("CSV file not found: {}", path.display()),
            )));
        }

        let mut reader = ReaderBuilder::new()
            .has_headers(true)
            .flexible(true)
            .from_path(path)
            .map_err(|e| {
                Error::Validation(ValidationError::InvalidInput(format!(
                    "Failed to read CSV: {}",
                    e
                )))
            })?;

        let mut assets_to_insert = Vec::new();

        for result in reader.deserialize() {
            let record: EtfFundCsvRecord = result.map_err(|e| {
                Error::Validation(ValidationError::InvalidInput(format!(
                    "Failed to parse CSV record: {}",
                    e
                )))
            })?;

            let new_asset = NewFinanceDatabaseAsset::from_csv_record(
                record.symbol,
                record.name,
                asset_type.to_string(),
                record.currency,
                record.summary,
                record.category_group,
                record.category,
                record.family,
                record.exchange,
                None, // cryptocurrency not applicable for ETF/Fund
            );

            assets_to_insert.push(new_asset);
        }

        self.batch_insert_assets(assets_to_insert)
    }

    /// Batch insert assets into the database
    fn batch_insert_assets(&self, assets: Vec<NewFinanceDatabaseAsset>) -> Result<usize> {
        if assets.is_empty() {
            return Ok(0);
        }

        let mut conn = self.pool.get()?;
        let mut total_inserted = 0;

        // SQLite doesn't support batch insert with ON CONFLICT in Diesel,
        // so we insert one by one with conflict handling
        for asset in assets {
            let inserted = diesel::insert_into(finance_database_assets::table)
                .values(&asset)
                .on_conflict((finance_database_assets::symbol, finance_database_assets::asset_type))
                .do_nothing()
                .execute(&mut conn)?;

            total_inserted += inserted;
        }

        Ok(total_inserted)
    }

    /// Search for assets by symbol or name
    pub fn search(&self, query: &str, limit: i64) -> Result<Vec<FinanceDatabaseSearchResult>> {
        let mut conn = self.pool.get()?;
        let search_pattern = format!("%{}%", query.to_uppercase());

        let results = finance_database_assets::table
            .filter(
                finance_database_assets::symbol
                    .like(&search_pattern)
                    .or(finance_database_assets::name.like(&search_pattern)),
            )
            .limit(limit)
            .load::<FinanceDatabaseAsset>(&mut conn)?;

        Ok(results.into_iter().map(|a| a.into()).collect())
    }

    /// Get asset by symbol and type
    pub fn get_by_symbol(
        &self,
        symbol: &str,
        asset_type: &str,
    ) -> Result<Option<FinanceDatabaseAsset>> {
        let mut conn = self.pool.get()?;

        let result = finance_database_assets::table
            .filter(finance_database_assets::symbol.eq(symbol))
            .filter(finance_database_assets::asset_type.eq(asset_type))
            .first::<FinanceDatabaseAsset>(&mut conn)
            .optional()?;

        Ok(result)
    }

    /// Count total assets in the database
    pub fn count(&self) -> Result<i64> {
        let mut conn = self.pool.get()?;
        let count = finance_database_assets::table
            .count()
            .get_result(&mut conn)?;
        Ok(count)
    }

    /// Count assets by type
    pub fn count_by_type(&self, asset_type: &str) -> Result<i64> {
        let mut conn = self.pool.get()?;
        let count = finance_database_assets::table
            .filter(finance_database_assets::asset_type.eq(asset_type))
            .count()
            .get_result(&mut conn)?;
        Ok(count)
    }
}
