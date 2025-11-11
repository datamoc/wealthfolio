use chrono::{DateTime, NaiveDate, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

// ============================================================================
// Reconciliation Session Models
// ============================================================================

/// Domain model representing a reconciliation session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconciliationSession {
    pub id: String,
    pub account_id: String,
    pub reconciliation_date: NaiveDate,
    pub status: ReconciliationStatus,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Database model for reconciliation sessions
#[derive(
    Queryable,
    Identifiable,
    Insertable,
    AsChangeset,
    Selectable,
    Serialize,
    Deserialize,
    Debug,
    Clone,
)]
#[diesel(table_name = crate::schema::reconciliation_sessions)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ReconciliationSessionDB {
    pub id: String,
    pub account_id: String,
    pub reconciliation_date: NaiveDate,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Reconciliation Item Models (Broker Statement Lines)
// ============================================================================

/// Domain model representing a line from a broker statement
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconciliationItem {
    pub id: String,
    pub session_id: String,
    pub symbol: String,
    pub quantity: f64,
    pub book_value: Option<f64>,
    pub market_value: Option<f64>,
    pub currency: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Database model for reconciliation items
#[derive(
    Queryable,
    Identifiable,
    Insertable,
    AsChangeset,
    Selectable,
    Serialize,
    Deserialize,
    Debug,
    Clone,
)]
#[diesel(table_name = crate::schema::reconciliation_items)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ReconciliationItemDB {
    pub id: String,
    pub session_id: String,
    pub symbol: String,
    pub quantity: f64,
    pub book_value: Option<f64>,
    pub market_value: Option<f64>,
    pub currency: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// Reconciliation Discrepancy Models
// ============================================================================

/// Domain model representing a discrepancy between expected and actual holdings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconciliationDiscrepancy {
    pub id: String,
    pub session_id: String,
    pub symbol: String,
    pub asset_id: Option<String>,
    pub expected_quantity: f64,
    pub actual_quantity: f64,
    pub quantity_difference: f64,
    pub expected_book_value: Option<f64>,
    pub actual_book_value: Option<f64>,
    pub status: DiscrepancyStatus,
    pub resolution_activity_id: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Database model for reconciliation discrepancies
#[derive(
    Queryable,
    Identifiable,
    Insertable,
    AsChangeset,
    Selectable,
    Serialize,
    Deserialize,
    Debug,
    Clone,
)]
#[diesel(table_name = crate::schema::reconciliation_discrepancies)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ReconciliationDiscrepancyDB {
    pub id: String,
    pub session_id: String,
    pub symbol: String,
    pub asset_id: Option<String>,
    pub expected_quantity: f64,
    pub actual_quantity: f64,
    pub quantity_difference: f64,
    pub expected_book_value: Option<f64>,
    pub actual_book_value: Option<f64>,
    pub status: String,
    pub resolution_activity_id: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Enums
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReconciliationStatus {
    Pending,
    Completed,
    Cancelled,
}

impl ReconciliationStatus {
    pub fn as_str(&self) -> &str {
        match self {
            ReconciliationStatus::Pending => "PENDING",
            ReconciliationStatus::Completed => "COMPLETED",
            ReconciliationStatus::Cancelled => "CANCELLED",
        }
    }
}

impl From<String> for ReconciliationStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "COMPLETED" => ReconciliationStatus::Completed,
            "CANCELLED" => ReconciliationStatus::Cancelled,
            _ => ReconciliationStatus::Pending,
        }
    }
}

impl From<&str> for ReconciliationStatus {
    fn from(s: &str) -> Self {
        ReconciliationStatus::from(s.to_string())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DiscrepancyStatus {
    Pending,
    Resolved,
    Ignored,
}

impl DiscrepancyStatus {
    pub fn as_str(&self) -> &str {
        match self {
            DiscrepancyStatus::Pending => "PENDING",
            DiscrepancyStatus::Resolved => "RESOLVED",
            DiscrepancyStatus::Ignored => "IGNORED",
        }
    }
}

impl From<String> for DiscrepancyStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "RESOLVED" => DiscrepancyStatus::Resolved,
            "IGNORED" => DiscrepancyStatus::Ignored,
            _ => DiscrepancyStatus::Pending,
        }
    }
}

impl From<&str> for DiscrepancyStatus {
    fn from(s: &str) -> Self {
        DiscrepancyStatus::from(s.to_string())
    }
}

// ============================================================================
// Conversion between DB and Domain models
// ============================================================================

impl From<ReconciliationSessionDB> for ReconciliationSession {
    fn from(db: ReconciliationSessionDB) -> Self {
        ReconciliationSession {
            id: db.id,
            account_id: db.account_id,
            reconciliation_date: db.reconciliation_date,
            status: ReconciliationStatus::from(db.status),
            notes: db.notes,
            created_at: db.created_at,
            updated_at: db.updated_at,
        }
    }
}

impl From<ReconciliationSession> for ReconciliationSessionDB {
    fn from(session: ReconciliationSession) -> Self {
        ReconciliationSessionDB {
            id: session.id,
            account_id: session.account_id,
            reconciliation_date: session.reconciliation_date,
            status: session.status.as_str().to_string(),
            notes: session.notes,
            created_at: session.created_at,
            updated_at: session.updated_at,
        }
    }
}

impl From<ReconciliationItemDB> for ReconciliationItem {
    fn from(db: ReconciliationItemDB) -> Self {
        ReconciliationItem {
            id: db.id,
            session_id: db.session_id,
            symbol: db.symbol,
            quantity: db.quantity,
            book_value: db.book_value,
            market_value: db.market_value,
            currency: db.currency,
            notes: db.notes,
            created_at: db.created_at,
        }
    }
}

impl From<ReconciliationItem> for ReconciliationItemDB {
    fn from(item: ReconciliationItem) -> Self {
        ReconciliationItemDB {
            id: item.id,
            session_id: item.session_id,
            symbol: item.symbol,
            quantity: item.quantity,
            book_value: item.book_value,
            market_value: item.market_value,
            currency: item.currency,
            notes: item.notes,
            created_at: item.created_at,
        }
    }
}

impl From<ReconciliationDiscrepancyDB> for ReconciliationDiscrepancy {
    fn from(db: ReconciliationDiscrepancyDB) -> Self {
        ReconciliationDiscrepancy {
            id: db.id,
            session_id: db.session_id,
            symbol: db.symbol,
            asset_id: db.asset_id,
            expected_quantity: db.expected_quantity,
            actual_quantity: db.actual_quantity,
            quantity_difference: db.quantity_difference,
            expected_book_value: db.expected_book_value,
            actual_book_value: db.actual_book_value,
            status: DiscrepancyStatus::from(db.status),
            resolution_activity_id: db.resolution_activity_id,
            notes: db.notes,
            created_at: db.created_at,
            updated_at: db.updated_at,
        }
    }
}

impl From<ReconciliationDiscrepancy> for ReconciliationDiscrepancyDB {
    fn from(disc: ReconciliationDiscrepancy) -> Self {
        ReconciliationDiscrepancyDB {
            id: disc.id,
            session_id: disc.session_id,
            symbol: disc.symbol,
            asset_id: disc.asset_id,
            expected_quantity: disc.expected_quantity,
            actual_quantity: disc.actual_quantity,
            quantity_difference: disc.quantity_difference,
            expected_book_value: disc.expected_book_value,
            actual_book_value: disc.actual_book_value,
            status: disc.status.as_str().to_string(),
            resolution_activity_id: disc.resolution_activity_id,
            notes: disc.notes,
            created_at: disc.created_at,
            updated_at: disc.updated_at,
        }
    }
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReconciliationSessionRequest {
    pub account_id: String,
    pub reconciliation_date: NaiveDate,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddReconciliationItemRequest {
    pub session_id: String,
    pub symbol: String,
    pub quantity: f64,
    pub book_value: Option<f64>,
    pub market_value: Option<f64>,
    pub currency: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconciliationSummary {
    pub session: ReconciliationSession,
    pub items: Vec<ReconciliationItem>,
    pub discrepancies: Vec<ReconciliationDiscrepancy>,
    pub total_items: usize,
    pub total_discrepancies: usize,
    pub unresolved_discrepancies: usize,
}
