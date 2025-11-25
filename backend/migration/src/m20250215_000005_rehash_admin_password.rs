use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // Rehash the default admin password to fix incorrect seed data
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(b"admin123", &salt)
            .map_err(|e| DbErr::Custom(format!("Failed to hash admin password: {e}")))?
            .to_string();

        db.execute_unprepared(&format!(
            r#"
            UPDATE users
            SET password_hash = '{}'
            WHERE email = 'admin@poblysh.com';
            "#,
            password_hash
        ))
        .await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // No-op: we cannot recover the previous insecure hash
        Ok(())
    }
}
