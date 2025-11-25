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
        // Default admin credentials:
        // Email: admin@poblysh.com
        // Password: admin123 (CHANGE THIS IN PRODUCTION!)

        let db = manager.get_connection();

        // Hash the default password at runtime to ensure compatibility with the auth module
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(b"admin123", &salt)
            .map_err(|e| DbErr::Custom(format!("Failed to hash default admin password: {e}")))?
            .to_string();

        db.execute_unprepared(&format!(
            r#"
            INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                'admin@poblysh.com',
                '{}',
                'Default Admin',
                'admin',
                true,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO NOTHING;
            "#,
            password_hash
        ))
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        db.execute_unprepared(
            r#"
            DELETE FROM users WHERE email = 'admin@poblysh.com';
            "#,
        )
        .await?;

        Ok(())
    }
}
