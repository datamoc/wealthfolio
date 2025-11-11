use crate::reconciliation::reconciliation_model::{
    ReconciliationDiscrepancyDB, ReconciliationItemDB, ReconciliationSessionDB,
};
use crate::schema::{reconciliation_discrepancies, reconciliation_items, reconciliation_sessions};
use crate::Result;
use diesel::prelude::*;
use diesel::SqliteConnection;

pub struct ReconciliationRepository;

impl ReconciliationRepository {
    // ========================================================================
    // Session Operations
    // ========================================================================

    pub fn create_session(
        conn: &mut SqliteConnection,
        session: &ReconciliationSessionDB,
    ) -> Result<ReconciliationSessionDB> {
        diesel::insert_into(reconciliation_sessions::table)
            .values(session)
            .execute(conn)?;

        let created_session = reconciliation_sessions::table
            .filter(reconciliation_sessions::id.eq(&session.id))
            .first::<ReconciliationSessionDB>(conn)?;

        Ok(created_session)
    }

    pub fn get_session_by_id(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<ReconciliationSessionDB> {
        let session = reconciliation_sessions::table
            .filter(reconciliation_sessions::id.eq(session_id))
            .first::<ReconciliationSessionDB>(conn)?;

        Ok(session)
    }

    pub fn get_sessions_by_account(
        conn: &mut SqliteConnection,
        account_id: &str,
    ) -> Result<Vec<ReconciliationSessionDB>> {
        let sessions = reconciliation_sessions::table
            .filter(reconciliation_sessions::account_id.eq(account_id))
            .order(reconciliation_sessions::reconciliation_date.desc())
            .load::<ReconciliationSessionDB>(conn)?;

        Ok(sessions)
    }

    pub fn update_session(
        conn: &mut SqliteConnection,
        session: &ReconciliationSessionDB,
    ) -> Result<ReconciliationSessionDB> {
        diesel::update(reconciliation_sessions::table)
            .filter(reconciliation_sessions::id.eq(&session.id))
            .set(session)
            .execute(conn)?;

        Self::get_session_by_id(conn, &session.id)
    }

    pub fn delete_session(conn: &mut SqliteConnection, session_id: &str) -> Result<()> {
        diesel::delete(reconciliation_sessions::table)
            .filter(reconciliation_sessions::id.eq(session_id))
            .execute(conn)?;

        Ok(())
    }

    // ========================================================================
    // Item Operations
    // ========================================================================

    pub fn create_item(
        conn: &mut SqliteConnection,
        item: &ReconciliationItemDB,
    ) -> Result<ReconciliationItemDB> {
        diesel::insert_into(reconciliation_items::table)
            .values(item)
            .execute(conn)?;

        let created_item = reconciliation_items::table
            .filter(reconciliation_items::id.eq(&item.id))
            .first::<ReconciliationItemDB>(conn)?;

        Ok(created_item)
    }

    pub fn create_items(
        conn: &mut SqliteConnection,
        items: &[ReconciliationItemDB],
    ) -> Result<Vec<ReconciliationItemDB>> {
        diesel::insert_into(reconciliation_items::table)
            .values(items)
            .execute(conn)?;

        let item_ids: Vec<String> = items.iter().map(|i| i.id.clone()).collect();

        let created_items = reconciliation_items::table
            .filter(reconciliation_items::id.eq_any(item_ids))
            .load::<ReconciliationItemDB>(conn)?;

        Ok(created_items)
    }

    pub fn get_items_by_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<Vec<ReconciliationItemDB>> {
        let items = reconciliation_items::table
            .filter(reconciliation_items::session_id.eq(session_id))
            .order(reconciliation_items::symbol.asc())
            .load::<ReconciliationItemDB>(conn)?;

        Ok(items)
    }

    pub fn update_item(
        conn: &mut SqliteConnection,
        item: &ReconciliationItemDB,
    ) -> Result<ReconciliationItemDB> {
        diesel::update(reconciliation_items::table)
            .filter(reconciliation_items::id.eq(&item.id))
            .set(item)
            .execute(conn)?;

        let updated_item = reconciliation_items::table
            .filter(reconciliation_items::id.eq(&item.id))
            .first::<ReconciliationItemDB>(conn)?;

        Ok(updated_item)
    }

    pub fn delete_item(conn: &mut SqliteConnection, item_id: &str) -> Result<()> {
        diesel::delete(reconciliation_items::table)
            .filter(reconciliation_items::id.eq(item_id))
            .execute(conn)?;

        Ok(())
    }

    // ========================================================================
    // Discrepancy Operations
    // ========================================================================

    pub fn create_discrepancy(
        conn: &mut SqliteConnection,
        discrepancy: &ReconciliationDiscrepancyDB,
    ) -> Result<ReconciliationDiscrepancyDB> {
        diesel::insert_into(reconciliation_discrepancies::table)
            .values(discrepancy)
            .execute(conn)?;

        let created_discrepancy = reconciliation_discrepancies::table
            .filter(reconciliation_discrepancies::id.eq(&discrepancy.id))
            .first::<ReconciliationDiscrepancyDB>(conn)?;

        Ok(created_discrepancy)
    }

    pub fn create_discrepancies(
        conn: &mut SqliteConnection,
        discrepancies: &[ReconciliationDiscrepancyDB],
    ) -> Result<Vec<ReconciliationDiscrepancyDB>> {
        diesel::insert_into(reconciliation_discrepancies::table)
            .values(discrepancies)
            .execute(conn)?;

        let discrepancy_ids: Vec<String> = discrepancies.iter().map(|d| d.id.clone()).collect();

        let created_discrepancies = reconciliation_discrepancies::table
            .filter(reconciliation_discrepancies::id.eq_any(discrepancy_ids))
            .load::<ReconciliationDiscrepancyDB>(conn)?;

        Ok(created_discrepancies)
    }

    pub fn get_discrepancies_by_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<Vec<ReconciliationDiscrepancyDB>> {
        let discrepancies = reconciliation_discrepancies::table
            .filter(reconciliation_discrepancies::session_id.eq(session_id))
            .order(reconciliation_discrepancies::symbol.asc())
            .load::<ReconciliationDiscrepancyDB>(conn)?;

        Ok(discrepancies)
    }

    pub fn get_unresolved_discrepancies_by_session(
        conn: &mut SqliteConnection,
        session_id: &str,
    ) -> Result<Vec<ReconciliationDiscrepancyDB>> {
        let discrepancies = reconciliation_discrepancies::table
            .filter(
                reconciliation_discrepancies::session_id
                    .eq(session_id)
                    .and(reconciliation_discrepancies::status.eq("PENDING")),
            )
            .order(reconciliation_discrepancies::symbol.asc())
            .load::<ReconciliationDiscrepancyDB>(conn)?;

        Ok(discrepancies)
    }

    pub fn update_discrepancy(
        conn: &mut SqliteConnection,
        discrepancy: &ReconciliationDiscrepancyDB,
    ) -> Result<ReconciliationDiscrepancyDB> {
        diesel::update(reconciliation_discrepancies::table)
            .filter(reconciliation_discrepancies::id.eq(&discrepancy.id))
            .set(discrepancy)
            .execute(conn)?;

        let updated_discrepancy = reconciliation_discrepancies::table
            .filter(reconciliation_discrepancies::id.eq(&discrepancy.id))
            .first::<ReconciliationDiscrepancyDB>(conn)?;

        Ok(updated_discrepancy)
    }

    pub fn delete_discrepancy(conn: &mut SqliteConnection, discrepancy_id: &str) -> Result<()> {
        diesel::delete(reconciliation_discrepancies::table)
            .filter(reconciliation_discrepancies::id.eq(discrepancy_id))
            .execute(conn)?;

        Ok(())
    }
}
