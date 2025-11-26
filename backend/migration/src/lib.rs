pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20250125_000001_create_users_table;
mod m20250125_000002_create_sessions_table;
mod m20250125_000003_create_password_reset_tokens_table;
mod m20250125_000004_seed_default_admin;
mod m20250215_000005_rehash_admin_password;
mod m20250306_000006_extend_outreach_log;
mod m20250310_000007_contact_trash_and_owner;

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
            Box::new(m20250306_000006_extend_outreach_log::Migration),
            Box::new(m20250310_000007_contact_trash_and_owner::Migration),
        ]
    }
}
