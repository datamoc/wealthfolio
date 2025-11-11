use std::sync::Arc;

use crate::context::ServiceContext;
use log::debug;
use tauri::State;
use wealthfolio_core::reconciliation::{
    AddReconciliationItemRequest, CreateReconciliationSessionRequest, ReconciliationDiscrepancy,
    ReconciliationItem, ReconciliationSession, ReconciliationSummary,
};

// ============================================================================
// Session Commands
// ============================================================================

#[tauri::command]
pub async fn create_reconciliation_session(
    request: CreateReconciliationSessionRequest,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationSession, String> {
    debug!("Creating reconciliation session...");
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::create_session(&mut conn, request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reconciliation_session(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationSession, String> {
    debug!("Getting reconciliation session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::get_session(&mut conn, &session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reconciliation_sessions_by_account(
    account_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<ReconciliationSession>, String> {
    debug!("Getting reconciliation sessions for account: {}", account_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::get_sessions_by_account(
        &mut conn,
        &account_id,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reconciliation_summary(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationSummary, String> {
    debug!("Getting reconciliation summary: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::get_session_summary(
        &mut conn,
        &session_id,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn complete_reconciliation_session(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationSession, String> {
    debug!("Completing reconciliation session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::complete_session(&mut conn, &session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cancel_reconciliation_session(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationSession, String> {
    debug!("Cancelling reconciliation session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::cancel_session(&mut conn, &session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_reconciliation_session(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<(), String> {
    debug!("Deleting reconciliation session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::delete_session(&mut conn, &session_id)
        .map_err(|e| e.to_string())
}

// ============================================================================
// Item Commands (Broker Statement Entries)
// ============================================================================

#[tauri::command]
pub async fn add_reconciliation_item(
    request: AddReconciliationItemRequest,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationItem, String> {
    debug!("Adding reconciliation item...");
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::add_item(&mut conn, request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_reconciliation_items(
    requests: Vec<AddReconciliationItemRequest>,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<ReconciliationItem>, String> {
    debug!("Adding {} reconciliation items...", requests.len());
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::add_items(&mut conn, requests)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reconciliation_items(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<ReconciliationItem>, String> {
    debug!("Getting reconciliation items for session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::get_items_by_session(
        &mut conn,
        &session_id,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_reconciliation_item(
    item_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<(), String> {
    debug!("Deleting reconciliation item: {}", item_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::delete_item(&mut conn, &item_id)
        .map_err(|e| e.to_string())
}

// ============================================================================
// Discrepancy Commands
// ============================================================================

#[tauri::command]
pub async fn calculate_discrepancies(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<ReconciliationDiscrepancy>, String> {
    debug!("Calculating discrepancies for session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::calculate_discrepancies(
        &mut conn,
        &session_id,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_discrepancies(
    session_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<ReconciliationDiscrepancy>, String> {
    debug!("Getting discrepancies for session: {}", session_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::get_discrepancies(&mut conn, &session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resolve_discrepancy(
    discrepancy_id: String,
    resolution_activity_id: Option<String>,
    notes: Option<String>,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationDiscrepancy, String> {
    debug!("Resolving discrepancy: {}", discrepancy_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::resolve_discrepancy(
        &mut conn,
        &discrepancy_id,
        resolution_activity_id,
        notes,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ignore_discrepancy(
    discrepancy_id: String,
    notes: Option<String>,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ReconciliationDiscrepancy, String> {
    debug!("Ignoring discrepancy: {}", discrepancy_id);
    let mut conn = state.pool().get().map_err(|e| e.to_string())?;
    wealthfolio_core::reconciliation::ReconciliationService::ignore_discrepancy(
        &mut conn,
        &discrepancy_id,
        notes,
    )
    .map_err(|e| e.to_string())
}
