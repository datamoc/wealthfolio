use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::schema::finance_database_assets;

/// Domain model representing a FinanceDatabase asset
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = finance_database_assets)]
#[serde(rename_all = "camelCase")]
pub struct FinanceDatabaseAsset {
    pub id: String,
    pub symbol: String,
    pub name: String,
    pub asset_type: String,
    pub currency: String,
    pub summary: Option<String>,
    pub category_group: Option<String>,
    pub category: Option<String>,
    pub family: Option<String>,
    pub exchange: Option<String>,
    pub cryptocurrency: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Input model for creating a new FinanceDatabase asset
#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = finance_database_assets)]
#[serde(rename_all = "camelCase")]
pub struct NewFinanceDatabaseAsset {
    pub id: String,
    pub symbol: String,
    pub name: String,
    pub asset_type: String,
    pub currency: String,
    pub summary: Option<String>,
    pub category_group: Option<String>,
    pub category: Option<String>,
    pub family: Option<String>,
    pub exchange: Option<String>,
    pub cryptocurrency: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl NewFinanceDatabaseAsset {
    /// Creates a new FinanceDatabaseAsset from CSV data
    pub fn from_csv_record(
        symbol: String,
        name: String,
        asset_type: String,
        currency: String,
        summary: Option<String>,
        category_group: Option<String>,
        category: Option<String>,
        family: Option<String>,
        exchange: Option<String>,
        cryptocurrency: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            symbol,
            name,
            asset_type,
            currency,
            summary,
            category_group,
            category,
            family,
            exchange,
            cryptocurrency,
            created_at: now.clone(),
            updated_at: now,
        }
    }
}

/// Search result model for FinanceDatabase assets
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceDatabaseSearchResult {
    pub symbol: String,
    pub name: String,
    pub asset_type: String,
    pub currency: String,
    pub exchange: Option<String>,
    pub category: Option<String>,
    pub summary: Option<String>,
}

impl From<FinanceDatabaseAsset> for FinanceDatabaseSearchResult {
    fn from(asset: FinanceDatabaseAsset) -> Self {
        Self {
            symbol: asset.symbol,
            name: asset.name,
            asset_type: asset.asset_type,
            currency: asset.currency,
            exchange: asset.exchange,
            category: asset.category,
            summary: asset.summary,
        }
    }
}
