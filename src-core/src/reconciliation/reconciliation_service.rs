use crate::portfolio::holdings::holdings_calculator::HoldingsCalculator;
use crate::reconciliation::reconciliation_model::{
    AddReconciliationItemRequest, CreateReconciliationSessionRequest, DiscrepancyStatus,
    ReconciliationDiscrepancy, ReconciliationDiscrepancyDB, ReconciliationItem,
    ReconciliationItemDB, ReconciliationSession, ReconciliationSessionDB, ReconciliationStatus,
    ReconciliationSummary,
};
use crate::reconciliation::reconciliation_repository::ReconciliationRepository;
use crate::Result;
use chrono::Utc;
use diesel::SqliteConnection;
use std::collections::HashMap;
use uuid::Uuid;

pub struct ReconciliationService;

impl ReconciliationService {
    // ========================================================================
    // Session Management
    // ========================================================================

    pub fn create_session(
        conn: &mut SqliteConnection,
        request: CreateReconciliationSessionRequest,
    ) -> Result<ReconciliationSession> {
        let now = Utc::now();
        let session_db = ReconciliationSessionDB {
            id: Uuid::new_v4().to_string(),
            account_id: request.account_id,
            reconciliation_date: request.reconciliation_date,
            status: ReconciliationStatus::Pending.as_str().to_string(),
            notes: request.notes,
            created_at: now,
            updated_at: now,
        };

        let created = ReconciliationRepository::create_session(conn, &session_db)?;
        Ok(ReconciliationSession::from(created))
    }

    pub fn get_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<ReconciliationSession> {
        let session_db = ReconciliationRepository::get_session_by_id(conn, session_id)?;
        Ok(ReconciliationSession::from(session_db))
    }

    pub fn get_sessions_by_account(
        conn: &mut SqliteConnection,
        account_id: &str,
    ) -> Result<Vec<ReconciliationSession>> {
        let sessions_db = ReconciliationRepository::get_sessions_by_account(conn, account_id)?;
        Ok(sessions_db
            .into_iter()
            .map(ReconciliationSession::from)
            .collect())
    }

    pub fn get_session_summary(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<ReconciliationSummary> {
        let session_db = ReconciliationRepository::get_session_by_id(conn, session_id)?;
        let items_db = ReconciliationRepository::get_items_by_session(conn, session_id)?;
        let discrepancies_db =
            ReconciliationRepository::get_discrepancies_by_session(conn, session_id)?;

        let unresolved_count = discrepancies_db
            .iter()
            .filter(|d| d.status == "PENDING")
            .count();

        Ok(ReconciliationSummary {
            session: ReconciliationSession::from(session_db),
            items: items_db.into_iter().map(ReconciliationItem::from).collect(),
            discrepancies: discrepancies_db
                .into_iter()
                .map(ReconciliationDiscrepancy::from)
                .collect(),
            total_items: items_db.len(),
            total_discrepancies: discrepancies_db.len(),
            unresolved_discrepancies: unresolved_count,
        })
    }

    pub fn complete_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<ReconciliationSession> {
        let mut session_db = ReconciliationRepository::get_session_by_id(conn, session_id)?;
        session_db.status = ReconciliationStatus::Completed.as_str().to_string();
        session_db.updated_at = Utc::now();

        let updated = ReconciliationRepository::update_session(conn, &session_db)?;
        Ok(ReconciliationSession::from(updated))
    }

    pub fn cancel_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<ReconciliationSession> {
        let mut session_db = ReconciliationRepository::get_session_by_id(conn, session_id)?;
        session_db.status = ReconciliationStatus::Cancelled.as_str().to_string();
        session_db.updated_at = Utc::now();

        let updated = ReconciliationRepository::update_session(conn, &session_db)?;
        Ok(ReconciliationSession::from(updated))
    }

    pub fn delete_session(conn: &mut SqliteConnection, session_id: &str) -> Result<()> {
        ReconciliationRepository::delete_session(conn, session_id)
    }

    // ========================================================================
    // Item Management (Broker Statement Entries)
    // ========================================================================

    pub fn add_item(
        conn: &mut SqliteConnection,
        request: AddReconciliationItemRequest,
    ) -> Result<ReconciliationItem> {
        let now = Utc::now();
        let item_db = ReconciliationItemDB {
            id: Uuid::new_v4().to_string(),
            session_id: request.session_id,
            symbol: request.symbol,
            quantity: request.quantity,
            book_value: request.book_value,
            market_value: request.market_value,
            currency: request.currency,
            notes: request.notes,
            created_at: now,
        };

        let created = ReconciliationRepository::create_item(conn, &item_db)?;
        Ok(ReconciliationItem::from(created))
    }

    pub fn add_items(
        conn: &mut SqliteConnection,
        requests: Vec<AddReconciliationItemRequest>,
    ) -> Result<Vec<ReconciliationItem>> {
        let now = Utc::now();
        let items_db: Vec<ReconciliationItemDB> = requests
            .into_iter()
            .map(|req| ReconciliationItemDB {
                id: Uuid::new_v4().to_string(),
                session_id: req.session_id,
                symbol: req.symbol,
                quantity: req.quantity,
                book_value: req.book_value,
                market_value: req.market_value,
                currency: req.currency,
                notes: req.notes,
                created_at: now,
            })
            .collect();

        let created = ReconciliationRepository::create_items(conn, &items_db)?;
        Ok(created.into_iter().map(ReconciliationItem::from).collect())
    }

    pub fn get_items_by_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<Vec<ReconciliationItem>> {
        let items_db = ReconciliationRepository::get_items_by_session(conn, session_id)?;
        Ok(items_db.into_iter().map(ReconciliationItem::from).collect())
    }

    pub fn delete_item(conn: &mut SqliteConnection, item_id: &str) -> Result<()> {
        ReconciliationRepository::delete_item(conn, item_id)
    }

    // ========================================================================
    // Reconciliation Logic - Compare Broker Statement with System Holdings
    // ========================================================================

    pub fn calculate_discrepancies(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<Vec<ReconciliationDiscrepancy>> {
        // Get the session to know which account and date we're reconciling
        let session = ReconciliationRepository::get_session_by_id(conn, session_id)?;

        // Get the broker statement items (what user entered)
        let broker_items = ReconciliationRepository::get_items_by_session(conn, session_id)?;

        // Calculate holdings from the system up to the reconciliation date
        let holdings_calculator = HoldingsCalculator::new(conn);
        let holdings = holdings_calculator
            .calculate_holdings(
                Some(vec![session.account_id.clone()]),
                Some(session.reconciliation_date),
            )
            .map_err(|e| {
                log::error!("Failed to calculate holdings: {:?}", e);
                e
            })?;

        // Build a map of symbol -> system quantity
        let mut system_holdings: HashMap<String, f64> = HashMap::new();
        for holding in holdings {
            if holding.account_id == session.account_id {
                let quantity = holding
                    .quantity
                    .to_string()
                    .parse::<f64>()
                    .unwrap_or(0.0);
                *system_holdings.entry(holding.symbol.clone()).or_insert(0.0) += quantity;
            }
        }

        // Build a map of symbol -> broker quantity
        let mut broker_holdings: HashMap<String, (f64, Option<f64>)> = HashMap::new();
        for item in &broker_items {
            broker_holdings.insert(item.symbol.clone(), (item.quantity, item.book_value));
        }

        // Find discrepancies
        let mut discrepancies = Vec::new();
        let now = Utc::now();

        // Check symbols that exist in either system or broker
        let mut all_symbols: Vec<String> = system_holdings.keys().cloned().collect();
        for symbol in broker_holdings.keys() {
            if !all_symbols.contains(symbol) {
                all_symbols.push(symbol.clone());
            }
        }

        for symbol in all_symbols {
            let system_qty = system_holdings.get(&symbol).copied().unwrap_or(0.0);
            let (broker_qty, broker_book_value) =
                broker_holdings.get(&symbol).copied().unwrap_or((0.0, None));

            // Only create discrepancy if there's a difference
            let diff = broker_qty - system_qty;
            if diff.abs() > 0.0001 {
                // Small threshold for floating point comparison
                let discrepancy_db = ReconciliationDiscrepancyDB {
                    id: Uuid::new_v4().to_string(),
                    session_id: session_id.to_string(),
                    symbol: symbol.clone(),
                    asset_id: None, // Could be looked up from assets table
                    expected_quantity: system_qty,
                    actual_quantity: broker_qty,
                    quantity_difference: diff,
                    expected_book_value: None, // Could be calculated from holdings
                    actual_book_value: broker_book_value,
                    status: DiscrepancyStatus::Pending.as_str().to_string(),
                    resolution_activity_id: None,
                    notes: None,
                    created_at: now,
                    updated_at: now,
                };

                discrepancies.push(discrepancy_db);
            }
        }

        // Save discrepancies to database
        if !discrepancies.is_empty() {
            let created = ReconciliationRepository::create_discrepancies(conn, &discrepancies)?;
            Ok(created
                .into_iter()
                .map(ReconciliationDiscrepancy::from)
                .collect())
        } else {
            Ok(Vec::new())
        }
    }

    pub fn get_discrepancies(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<Vec<ReconciliationDiscrepancy>> {
        let discrepancies_db =
            ReconciliationRepository::get_discrepancies_by_session(conn, session_id)?;
        Ok(discrepancies_db
            .into_iter()
            .map(ReconciliationDiscrepancy::from)
            .collect())
    }

    pub fn resolve_discrepancy(
        conn: &mut SqliteConnection,
        discrepancy_id: &str,
        resolution_activity_id: Option<String>,
        notes: Option<String>,
    ) -> Result<ReconciliationDiscrepancy> {
        let discrepancy_db =
            ReconciliationRepository::get_discrepancies_by_session(conn, discrepancy_id)?
                .into_iter()
                .find(|d| d.id == discrepancy_id)
                .ok_or_else(|| {
                    diesel::result::Error::NotFound
                        .to_string()
                        .into()
                })?;

        let mut updated = discrepancy_db;
        updated.status = DiscrepancyStatus::Resolved.as_str().to_string();
        updated.resolution_activity_id = resolution_activity_id;
        updated.notes = notes;
        updated.updated_at = Utc::now();

        let result = ReconciliationRepository::update_discrepancy(conn, &updated)?;
        Ok(ReconciliationDiscrepancy::from(result))
    }

    pub fn ignore_discrepancy(
        conn: &mut SqliteConnection,
        discrepancy_id: &str,
        notes: Option<String>,
    ) -> Result<ReconciliationDiscrepancy> {
        let discrepancy_db =
            ReconciliationRepository::get_discrepancies_by_session(conn, discrepancy_id)?
                .into_iter()
                .find(|d| d.id == discrepancy_id)
                .ok_or_else(|| {
                    diesel::result::Error::NotFound
                        .to_string()
                        .into()
                })?;

        let mut updated = discrepancy_db;
        updated.status = DiscrepancyStatus::Ignored.as_str().to_string();
        updated.notes = notes;
        updated.updated_at = Utc::now();

        let result = ReconciliationRepository::update_discrepancy(conn, &updated)?;
        Ok(ReconciliationDiscrepancy::from(result))
    }
}
