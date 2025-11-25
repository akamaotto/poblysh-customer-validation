pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20250125_000001_create_users_table;
mod m20250125_000002_create_sessions_table;
mod m20250125_000003_create_password_reset_tokens_table;
mod m20250125_000004_seed_default_admin;
mod m20250215_000005_rehash_admin_password;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20250125_000001_create_users_table::Migration),
            Box::new(m20250125_000002_create_sessions_table::Migration),
            Box::new(m20250125_000003_create_password_reset_tokens_table::Migration),
            Box::new(m20250125_000004_seed_default_admin::Migration),
            Box::new(m20250215_000005_rehash_admin_password::Migration),
        ]
    }
}
