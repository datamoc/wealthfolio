use chrono::Local;
use log::{error, info, warn};
use std::fs;
use std::io;
use std::path::Path;
use std::sync::Arc;

use diesel::connection::{Connection, SimpleConnection};
use diesel::r2d2;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

use crate::errors::{DatabaseError, Error, Result};

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

pub type DbPool = r2d2::Pool<ConnectionManager<SqliteConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<SqliteConnection>>;

pub mod write_actor;
pub use write_actor::WriteHandle;

pub fn init(app_data_dir: &str) -> Result<String> {
    info!("Initializing database system");
    info!("App data directory: {}", app_data_dir);

    // First, validate that app_data_dir path itself is correct
    let app_data_path = Path::new(app_data_dir);

    // Critical fix: Check if app_data_dir exists as a FILE (should be a directory)
    if app_data_path.exists() && !app_data_path.is_dir() {
        error!(
            "App data path exists as a file instead of directory: {}. Attempting to fix...",
            app_data_dir
        );

        // Try to remove the file
        fs::remove_file(app_data_path).map_err(|e| {
            error!("Failed to remove app data file: {}", e);
            Error::Database(DatabaseError::Internal(format!(
                "App data path '{}' is a file, not a directory. Failed to remove it: {}",
                app_data_dir, e
            )))
        })?;

        info!("Successfully removed app data file, will create as directory");
    }

    // Ensure app_data_dir exists as a directory
    if !app_data_path.exists() {
        info!("App data directory does not exist, creating: {}", app_data_dir);
        fs::create_dir_all(app_data_path).map_err(|e| {
            error!("Failed to create app data directory: {}", e);
            Error::Database(DatabaseError::Internal(format!(
                "Failed to create app data directory '{}': {}",
                app_data_dir, e
            )))
        })?;
        info!("Created app data directory: {}", app_data_dir);
    } else {
        info!("App data directory already exists: {}", app_data_dir);
    }

    let db_path = get_db_path(app_data_dir);
    info!("Database path: {}", db_path);

    // Check if database file exists
    let db_file_path = Path::new(&db_path);
    let db_exists = db_file_path.exists();

    if db_exists {
        info!("Database file already exists at: {}", db_path);

        // Verify it's actually a file and not a directory
        if !db_file_path.is_file() {
            error!("Database path exists but is not a file: {}", db_path);
            return Err(Error::Database(DatabaseError::Internal(format!(
                "Database path '{}' exists but is not a file",
                db_path
            ))));
        }

        // Check if file is readable
        match fs::metadata(&db_path) {
            Ok(metadata) => {
                info!("Database file size: {} bytes", metadata.len());
            }
            Err(e) => {
                error!("Cannot read database file metadata: {}", e);
                return Err(Error::Database(DatabaseError::Internal(format!(
                    "Cannot read database file '{}': {}",
                    db_path, e
                ))));
            }
        }
    } else {
        info!("Database file does not exist, will be created at: {}", db_path);
    }

    // 2. Ensure database directory exists
    let db_dir = Path::new(&db_path).parent().unwrap();
    if !db_dir.exists() {
        info!("Creating database directory: {}", db_dir.display());
        fs::create_dir_all(db_dir)?;
    }

    info!("Establishing database connection and setting SQLite pragmas");
    {
        let mut conn = SqliteConnection::establish(&db_path)?;
        conn.batch_execute(
            "\n            PRAGMA journal_mode = WAL;\n            PRAGMA foreign_keys = ON;\n            PRAGMA busy_timeout = 30000;\n            PRAGMA synchronous  = NORMAL;\n        ",
        )?;
    }

    if !db_exists {
        info!("Database file successfully created at: {}", db_path);
    } else {
        info!("Database connection established successfully");
    }

    Ok(db_path)
}

pub fn create_pool(db_path: &str) -> Result<Arc<DbPool>> {
    info!("Creating database connection pool for: {}", db_path);
    let manager = ConnectionManager::<SqliteConnection>::new(db_path);
    let pool = r2d2::Pool::builder()
        .max_size(8)
        .min_idle(Some(1)) // Keep at least one connection ready
        .connection_timeout(std::time::Duration::from_secs(30))
        .connection_customizer(Box::new(ConnectionCustomizer {}))
        .build(manager)
        .map_err(|e| {
            error!("Failed to create database connection pool: {}", e);
            DatabaseError::PoolCreationFailed(e)
        })?;
    info!("Database connection pool created successfully (max size: 8, min idle: 1)");
    Ok(Arc::new(pool))
}

pub fn run_migrations(pool: &DbPool) -> Result<()> {
    info!("Checking for database migrations");
    let mut connection = get_connection(pool).map_err(|e| {
        error!("Failed to get database connection for migrations: {}", e);
        e
    })?;

    let result = connection.run_pending_migrations(MIGRATIONS).map_err(|e| {
        error!("Database migration failed: {}", e);
        Error::Database(DatabaseError::MigrationFailed(e.to_string()))
    })?;

    if result.is_empty() {
        info!("No pending migrations to apply - database schema is up to date");
    } else {
        info!("Successfully applied {} migration(s):", result.len());
        for migration_version in &result {
            info!("  - {}", migration_version);
        }
    }

    Ok(())
}

pub fn get_db_path(input: &str) -> String {
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        // On mobile (iOS/Android), always keep the database inside the app's sandbox
        // to avoid permission issues. Ignore DATABASE_URL entirely.
        return Path::new(input)
            .join("app.db")
            .to_str()
            .unwrap()
            .to_string();
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // Desktop/server behavior:
        // 1) Check DATABASE_URL if provided
        if let Ok(url) = std::env::var("DATABASE_URL") {
            let url_path = Path::new(&url);

            // Check if this is actually a database file by checking for .db extension
            // (Don't just check for any extension, as directories like "com.teymz.wealthfolio" have dots)
            if let Some(ext) = url_path.extension() {
                if ext == "db" || ext == "sqlite" || ext == "sqlite3" {
                    info!("Using DATABASE_URL as database file path: {}", url);
                    return url;
                }
            }

            // If DATABASE_URL is a directory (or has a non-database extension), append app.db to it
            warn!("DATABASE_URL appears to be a directory or has non-database extension, appending 'app.db': {}", url);
            return url_path.join("app.db").to_str().unwrap().to_string();
        }

        // 2) If input looks like a database file (has .db extension), use it directly
        let p = Path::new(input);
        if let Some(ext) = p.extension() {
            if ext == "db" || ext == "sqlite" || ext == "sqlite3" {
                return p.to_str().unwrap().to_string();
            }
        }

        // 3) Otherwise, treat it as a directory and append default filename
        return p.join("app.db").to_str().unwrap().to_string();
    }
}

pub fn create_backup_path(app_data_dir: &str) -> Result<String> {
    let backup_dir = Path::new(app_data_dir).join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| {
        error!("Failed to create backup directory: {}", e);
        Error::Database(DatabaseError::BackupFailed(e.to_string()))
    })?;

    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_file = format!("wealthfolio_backup_{}.db", timestamp);
    let backup_path = backup_dir.join(backup_file);

    Ok(backup_path.to_str().unwrap().to_string())
}

pub fn backup_database(app_data_dir: &str) -> Result<String> {
    let db_path = get_db_path(app_data_dir);
    let backup_path = create_backup_path(app_data_dir)?;

    info!(
        "Creating database backup from {} to {}",
        db_path, backup_path
    );

    // Copy main database file
    fs::copy(&db_path, &backup_path).map_err(|e| {
        error!("Failed to create database backup: {}", e);
        Error::Database(DatabaseError::BackupFailed(e.to_string()))
    })?;

    // Copy WAL file if it exists
    let wal_source = format!("{}-wal", db_path);
    let wal_target = format!("{}-wal", backup_path);
    if Path::new(&wal_source).exists() {
        fs::copy(&wal_source, &wal_target).map_err(|e| {
            error!("Failed to copy WAL file: {}", e);
            Error::Database(DatabaseError::BackupFailed(e.to_string()))
        })?;
    }

    // Copy SHM file if it exists
    let shm_source = format!("{}-shm", db_path);
    let shm_target = format!("{}-shm", backup_path);
    if Path::new(&shm_source).exists() {
        fs::copy(&shm_source, &shm_target).map_err(|e| {
            error!("Failed to copy SHM file: {}", e);
            Error::Database(DatabaseError::BackupFailed(e.to_string()))
        })?;
    }

    info!("Database backup created successfully (including WAL/SHM files if present)");
    Ok(backup_path)
}

pub fn restore_database(app_data_dir: &str, backup_file_path: &str) -> Result<()> {
    let db_path = get_db_path(app_data_dir);

    info!(
        "Restoring database from {} to {}",
        backup_file_path, db_path
    );

    // Verify backup file exists
    if !Path::new(backup_file_path).exists() {
        return Err(Error::Database(DatabaseError::BackupFailed(
            "Backup file not found".to_string(),
        )));
    }

    // Create backup of current database before restore
    let restore_backup_path = format!(
        "{}.pre-restore-{}",
        db_path,
        Local::now().format("%Y%m%d_%H%M%S")
    );

    if Path::new(&db_path).exists() {
        // Copy main database file
        fs::copy(&db_path, &restore_backup_path).map_err(|e| {
            error!("Failed to create pre-restore backup: {}", e);
            Error::Database(DatabaseError::BackupFailed(e.to_string()))
        })?;

        // Copy WAL file if it exists
        let current_wal_path = format!("{}-wal", db_path);
        let backup_wal_path = format!("{}-wal", restore_backup_path);
        if Path::new(&current_wal_path).exists() {
            fs::copy(&current_wal_path, &backup_wal_path).map_err(|e| {
                error!("Failed to copy WAL file during pre-restore backup: {}", e);
                Error::Database(DatabaseError::BackupFailed(e.to_string()))
            })?;
        }

        // Copy SHM file if it exists
        let current_shm_path = format!("{}-shm", db_path);
        let backup_shm_path = format!("{}-shm", restore_backup_path);
        if Path::new(&current_shm_path).exists() {
            fs::copy(&current_shm_path, &backup_shm_path).map_err(|e| {
                error!("Failed to copy SHM file during pre-restore backup: {}", e);
                Error::Database(DatabaseError::BackupFailed(e.to_string()))
            })?;
        }

        info!(
            "Created pre-restore backup at: {} (including WAL/SHM files if present)",
            restore_backup_path
        );
    }

    // Remove existing WAL and SHM files to ensure clean state.
    // On Windows, these files might be locked by active connections; tolerate sharing violations.
    let wal_path = format!("{}-wal", db_path);
    let shm_path = format!("{}-shm", db_path);

    if Path::new(&wal_path).exists() {
        if let Err(e) = try_remove_file_best_effort(&wal_path, "WAL") {
            return Err(Error::Database(DatabaseError::BackupFailed(e.to_string())));
        }
    }

    if Path::new(&shm_path).exists() {
        if let Err(e) = try_remove_file_best_effort(&shm_path, "SHM") {
            return Err(Error::Database(DatabaseError::BackupFailed(e.to_string())));
        }
    }

    // Copy the main backup file
    copy_with_retries(
        backup_file_path,
        &db_path,
        5,
        std::time::Duration::from_millis(200),
    )?;

    // Copy WAL file if it exists in backup
    let backup_wal_path = format!("{}-wal", backup_file_path);
    if Path::new(&backup_wal_path).exists() {
        if let Err(e) = copy_with_retries(
            &backup_wal_path,
            &wal_path,
            3,
            std::time::Duration::from_millis(200),
        ) {
            // WAL copy failure is non-fatal; DB will recreate WAL on next write.
            warn!("Failed to restore WAL file (non-fatal): {}", e);
        }
    }

    // Copy SHM file if it exists in backup
    let backup_shm_path = format!("{}-shm", backup_file_path);
    if Path::new(&backup_shm_path).exists() {
        if let Err(e) = copy_with_retries(
            &backup_shm_path,
            &shm_path,
            3,
            std::time::Duration::from_millis(200),
        ) {
            // SHM copy failure is non-fatal; it'll be recreated as needed.
            warn!("Failed to restore SHM file (non-fatal): {}", e);
        }
    }

    // Ensure desired journal mode; recreate WAL after restore for consistency
    if let Ok(mut conn) = SqliteConnection::establish(&db_path) {
        let _ = conn.batch_execute("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    }

    info!("Database restored successfully");
    Ok(())
}

/// Function to safely restore database with connection management
/// This is the main function that should be called from Tauri commands
pub fn restore_database_safe(app_data_dir: &str, backup_file_path: &str) -> Result<()> {
    // First, execute a checkpoint to force WAL content to be written to the main database file
    // This helps reduce the chance of WAL files being locked on Windows
    let db_path = get_db_path(app_data_dir);

    // Try to checkpoint the database before restore
    if let Ok(mut conn) = SqliteConnection::establish(&db_path) {
        use diesel::RunQueryDsl;
        let _ = diesel::sql_query("PRAGMA wal_checkpoint(TRUNCATE)").execute(&mut conn);
        // Try to temporarily switch to DELETE journal mode to minimize WAL interactions
        let _ = diesel::sql_query("PRAGMA journal_mode = DELETE").execute(&mut conn);
        info!("Executed WAL checkpoint before restore");
    }

    // Small delay to allow any pending operations to complete
    std::thread::sleep(std::time::Duration::from_millis(150));

    // Now perform the actual restore
    restore_database(app_data_dir, backup_file_path)
}

/// Recovers from a corrupted database by backing it up and removing it
/// Returns the path to the backup file if successful
pub fn recover_corrupted_database(db_path: &str) -> Result<String> {
    info!("Attempting database recovery for: {}", db_path);

    // Create timestamped backup of corrupted database
    let db_file = Path::new(db_path);
    let parent_dir = db_file
        .parent()
        .ok_or_else(|| Error::Database(DatabaseError::BackupFailed("No parent directory".to_string())))?;

    let backup_dir = parent_dir.join("corrupted_backups");
    fs::create_dir_all(&backup_dir).map_err(|e| {
        error!("Failed to create corrupted backup directory: {}", e);
        Error::Database(DatabaseError::BackupFailed(e.to_string()))
    })?;

    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_file = format!(
        "corrupted_{}.db",
        timestamp
    );
    let backup_path = backup_dir.join(backup_file);
    let backup_path_str = backup_path.to_str().unwrap().to_string();

    info!("Backing up corrupted database to: {}", backup_path_str);

    // Copy main database file if it exists
    if db_file.exists() {
        fs::copy(db_path, &backup_path).map_err(|e| {
            error!("Failed to backup corrupted database: {}", e);
            Error::Database(DatabaseError::BackupFailed(e.to_string()))
        })?;
    }

    // Copy WAL file if it exists
    let wal_source = format!("{}-wal", db_path);
    let wal_target = format!("{}-wal", backup_path_str);
    if Path::new(&wal_source).exists() {
        fs::copy(&wal_source, &wal_target).ok(); // Non-fatal
    }

    // Copy SHM file if it exists
    let shm_source = format!("{}-shm", db_path);
    let shm_target = format!("{}-shm", backup_path_str);
    if Path::new(&shm_source).exists() {
        fs::copy(&shm_source, &shm_target).ok(); // Non-fatal
    }

    info!("Corrupted database backed up successfully");

    // Now remove corrupted files to allow fresh database creation
    if db_file.exists() {
        try_remove_file_best_effort(db_path, "main database")?;
    }

    let wal_path = format!("{}-wal", db_path);
    if Path::new(&wal_path).exists() {
        try_remove_file_best_effort(&wal_path, "WAL")?;
    }

    let shm_path = format!("{}-shm", db_path);
    if Path::new(&shm_path).exists() {
        try_remove_file_best_effort(&shm_path, "SHM")?;
    }

    info!("Corrupted database files removed, ready for fresh initialization");

    Ok(backup_path_str)
}

/// Gets a connection from the pool
pub fn get_connection(pool: &Pool<ConnectionManager<SqliteConnection>>) -> Result<DbConnection> {
    Ok(pool.get()?)
}

#[derive(Debug)]
struct ConnectionCustomizer;

impl r2d2::CustomizeConnection<SqliteConnection, diesel::r2d2::Error> for ConnectionCustomizer {
    fn on_acquire(
        &self,
        conn: &mut SqliteConnection,
    ) -> std::result::Result<(), diesel::r2d2::Error> {
        use diesel::RunQueryDsl;

        diesel::sql_query(
            "\n            PRAGMA foreign_keys = ON;\n            PRAGMA busy_timeout = 30000;\n            PRAGMA synchronous = NORMAL;\n        ",
        )
        .execute(conn)
        .map_err(diesel::r2d2::Error::QueryError)?;

        Ok(())
    }
}

// --- Internal helpers for robust, cross-platform file operations ---

/// Determine if an IO error on Windows is a sharing/lock violation.
#[inline]
#[allow(unused_variables)]
fn is_sharing_violation(e: &io::Error) -> bool {
    #[cfg(target_os = "windows")]
    {
        matches!(e.raw_os_error(), Some(32) | Some(33))
    }
    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

/// Try to remove a file; on Windows, tolerate sharing violations and continue.
fn try_remove_file_best_effort(path: &str, label: &str) -> std::result::Result<(), io::Error> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(e) => {
            if is_sharing_violation(&e) {
                warn!(
                    "{} file appears to be in use ({}). Proceeding with restore anyway.",
                    label, e
                );
                Ok(())
            } else if e.kind() == io::ErrorKind::NotFound {
                Ok(())
            } else {
                error!("Failed to remove existing {} file '{}': {}", label, path, e);
                Err(e)
            }
        }
    }
}

/// Copy a file with retry/backoff; maps errors into existing Result type on failure.
fn copy_with_retries(
    src: &str,
    dst: &str,
    attempts: usize,
    backoff: std::time::Duration,
) -> Result<()> {
    let mut last_err: Option<io::Error> = None;
    for i in 0..attempts {
        match fs::copy(src, dst) {
            Ok(_) => return Ok(()),
            Err(e) => {
                last_err = Some(e);
                // On Windows, if destination is locked, wait and retry
                if let Some(ref err) = last_err {
                    if is_sharing_violation(err) {
                        warn!(
                            "Attempt {}/{}: destination appears locked when copying to '{}'. Retrying in {:?}...",
                            i + 1,
                            attempts,
                            dst,
                            backoff
                        );
                        std::thread::sleep(backoff);
                        continue;
                    }
                }
                // For other errors, retry a couple times anyway
                warn!(
                    "Attempt {}/{}: failed to copy '{}' -> '{}': {}. Retrying in {:?}...",
                    i + 1,
                    attempts,
                    src,
                    dst,
                    last_err.as_ref().unwrap(),
                    backoff
                );
                std::thread::sleep(backoff);
            }
        }
    }
    let e = last_err.unwrap_or_else(|| io::Error::new(io::ErrorKind::Other, "unknown copy error"));
    error!("Failed to copy '{}' -> '{}': {}", src, dst, e);
    Err(Error::Database(DatabaseError::BackupFailed(e.to_string())))
}

/// Trait for executing database transactions
pub trait DbTransactionExecutor {
    /// Execute operations within a transaction and return the result
    fn execute<F, T, E>(&self, f: F) -> Result<T>
    where
        F: FnOnce(&mut DbConnection) -> std::result::Result<T, E>,
        E: Into<Error>;
}

/// Implementation of DbTransactionExecutor for DbPool
impl DbTransactionExecutor for DbPool {
    fn execute<F, T, E>(&self, f: F) -> Result<T>
    where
        F: FnOnce(&mut DbConnection) -> std::result::Result<T, E>,
        E: Into<Error>,
    {
        let mut conn = self.get()?;

        conn.transaction(|tx_conn| {
            f(tx_conn).map_err(|_| diesel::result::Error::RollbackTransaction)
        })
        .map_err(|e| Error::Database(DatabaseError::QueryFailed(e)))
    }
}

/// Implementation of DbTransactionExecutor for Arc<DbPool>
impl DbTransactionExecutor for Arc<DbPool> {
    fn execute<F, T, E>(&self, f: F) -> Result<T>
    where
        F: FnOnce(&mut DbConnection) -> std::result::Result<T, E>,
        E: Into<Error>,
    {
        (**self).execute(f)
    }
}
