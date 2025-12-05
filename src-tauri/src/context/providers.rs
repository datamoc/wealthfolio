use super::registry::ServiceContext;
use crate::secret_store::shared_secret_store;
use std::sync::{Arc, RwLock};
use wealthfolio_core::{
    accounts::{AccountRepository, AccountService},
    activities::{ActivityRepository, ActivityService},
    db::{self, write_actor},
    finance_database::FinanceDatabaseService,
    fx::{FxRepository, FxService, FxServiceTrait},
    goals::{GoalRepository, GoalService},
    limits::{ContributionLimitRepository, ContributionLimitService},
    market_data::{MarketDataRepository, MarketDataService, MarketDataServiceTrait},
    portfolio::{
        holdings::{HoldingsService, HoldingsValuationService},
        income::IncomeService,
        performance::PerformanceService,
    },
    settings::{settings_repository::SettingsRepository, SettingsService, SettingsServiceTrait},
    snapshot::{SnapshotRepository, SnapshotService},
    valuation::{ValuationRepository, ValuationService},
    AssetRepository, AssetService,
};

// Other imports

pub struct InitializationResult {
    pub context: ServiceContext,
    pub recovery_backup_path: Option<String>,
}

pub async fn initialize_context(
    app_data_dir: &str,
) -> Result<InitializationResult, Box<dyn std::error::Error>> {
    log::info!("Starting application context initialization");
    log::info!("App data directory: {}", app_data_dir);

    let db_path = db::init(app_data_dir)?;
    log::info!("Database initialization completed, path: {}", db_path);

    let pool = db::create_pool(&db_path)?;
    log::info!("Database connection pool created");

    let writer = write_actor::spawn_writer(pool.as_ref().clone());
    log::info!("Database write actor spawned");

    // Run migrations with auto-recovery on failure
    let mut recovery_backup_path: Option<String> = None;

    if let Err(migration_error) = db::run_migrations(&pool) {
        log::error!("Migration failed: {}", migration_error);
        log::warn!("Attempting to recover by backing up corrupted database and starting fresh...");

        // Drop the pool to release database connections
        drop(writer);
        drop(pool);

        // Attempt recovery
        match db::recover_corrupted_database(&db_path) {
            Ok(backup_path) => {
                log::info!("Corrupted database backed up to: {}", backup_path);
                log::info!("Creating fresh database at: {}", db_path);

                recovery_backup_path = Some(backup_path);

                // Re-initialize with fresh database
                log::info!("Re-initializing database after recovery");
                let pool = db::create_pool(&db_path)?;
                let writer = write_actor::spawn_writer(pool.as_ref().clone());
                db::run_migrations(&pool)?;

                log::info!("Database recovery successful, initializing services");
                let context = initialize_services(pool, writer).await?;
                log::info!("Application context initialized successfully (after recovery)");
                return Ok(InitializationResult {
                    context,
                    recovery_backup_path,
                });
            }
            Err(recovery_error) => {
                log::error!("Database recovery failed: {}", recovery_error);
                log::error!("Original migration error: {}", migration_error);
                return Err(Box::new(migration_error));
            }
        }
    }

    log::info!("Initializing services");
    let context = initialize_services(pool, writer).await?;
    log::info!("Application context initialized successfully");
    Ok(InitializationResult {
        context,
        recovery_backup_path,
    })
}

async fn initialize_services(
    pool: std::sync::Arc<db::DbPool>,
    writer: db::WriteHandle,
) -> Result<ServiceContext, Box<dyn std::error::Error>> {

    // Instantiate Repositories
    let settings_repository = Arc::new(SettingsRepository::new(pool.clone(), writer.clone()));
    let account_repository = Arc::new(AccountRepository::new(pool.clone(), writer.clone()));
    let activity_repository = Arc::new(ActivityRepository::new(pool.clone(), writer.clone()));
    let asset_repository = Arc::new(AssetRepository::new(pool.clone(), writer.clone()));
    let goal_repo = Arc::new(GoalRepository::new(pool.clone(), writer.clone()));
    let market_data_repo = Arc::new(MarketDataRepository::new(pool.clone(), writer.clone()));
    let limit_repository = Arc::new(ContributionLimitRepository::new(
        pool.clone(),
        writer.clone(),
    ));
    let fx_repository = Arc::new(FxRepository::new(pool.clone(), writer.clone()));
    let snapshot_repository = Arc::new(SnapshotRepository::new(pool.clone(), writer.clone()));
    let valuation_repository = Arc::new(ValuationRepository::new(pool.clone(), writer.clone()));
    // Instantiate Transaction Executor using the Arc<DbPool> directly
    let transaction_executor = pool.clone();

    let fx_service = Arc::new(FxService::new(fx_repository.clone()));
    fx_service.initialize()?;

    let settings_service = Arc::new(SettingsService::new(
        settings_repository.clone(),
        fx_service.clone(),
    ));
    let settings = settings_service.get_settings()?;
    let base_currency_string = settings.base_currency.clone();
    let base_currency = Arc::new(RwLock::new(base_currency_string.clone()));
    let instance_id = Arc::new(settings.instance_id.clone());

    let secret_store = shared_secret_store();
    let market_data_service: Arc<dyn MarketDataServiceTrait> = Arc::new(
        MarketDataService::new(
            market_data_repo.clone(),
            asset_repository.clone(),
            secret_store.clone(),
        )
        .await?,
    );

    let asset_service = Arc::new(AssetService::new(
        asset_repository.clone(),
        market_data_service.clone(),
    )?);

    let account_service = Arc::new(AccountService::new(
        account_repository.clone(),
        fx_service.clone(),
        transaction_executor.clone(),
        base_currency.clone(),
    ));
    let activity_service = Arc::new(ActivityService::new(
        activity_repository.clone(),
        account_service.clone(),
        asset_service.clone(),
        fx_service.clone(),
    ));
    let goal_service = Arc::new(GoalService::new(goal_repo.clone()));
    let limits_service = Arc::new(ContributionLimitService::new(
        fx_service.clone(),
        limit_repository.clone(),
        activity_repository.clone(),
    ));

    let income_service = Arc::new(IncomeService::new(
        fx_service.clone(),
        activity_repository.clone(),
        base_currency.clone(),
    ));

    let snapshot_service = Arc::new(SnapshotService::new(
        base_currency.clone(),
        account_repository.clone(),
        activity_repository.clone(),
        snapshot_repository.clone(),
        asset_repository.clone(),
        fx_service.clone(),
    ));

    let holdings_valuation_service = Arc::new(HoldingsValuationService::new(
        fx_service.clone(),
        market_data_service.clone(),
    ));

    let valuation_service = Arc::new(ValuationService::new(
        base_currency.clone(),
        valuation_repository.clone(),
        snapshot_service.clone(),
        market_data_service.clone(),
        fx_service.clone(),
    ));

    let performance_service = Arc::new(PerformanceService::new(
        valuation_service.clone(),
        market_data_service.clone(),
    ));

    let holdings_service = Arc::new(HoldingsService::new(
        asset_service.clone(),
        snapshot_service.clone(),
        holdings_valuation_service.clone(),
    ));

    let finance_database_service = Arc::new(FinanceDatabaseService::new(pool.clone()));

    Ok(ServiceContext {
        base_currency,
        instance_id,
        settings_service,
        account_service,
        activity_service,
        asset_service,
        goal_service,
        market_data_service,
        limits_service,
        fx_service,
        performance_service,
        income_service,
        snapshot_service,
        holdings_service,
        valuation_service,
        finance_database_service,
    })
}
