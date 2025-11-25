use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(uuid(Users::Id).primary_key())
                    .col(string(Users::Email).unique_key().not_null())
                    .col(string(Users::PasswordHash).not_null())
                    .col(string_null(Users::Name))
                    .col(string(Users::Role).not_null().default("user"))
                    .col(boolean(Users::IsActive).not_null().default(true))
                    .col(boolean(Users::EmailVerified).not_null().default(false))
                    .col(timestamp(Users::CreatedAt).not_null())
                    .col(timestamp(Users::UpdatedAt).not_null())
                    .to_owned(),
            )
            .await?;

        // Create index on email for faster lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_users_email")
                    .table(Users::Table)
                    .col(Users::Email)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Email,
    PasswordHash,
    Name,
    Role,
    IsActive,
    EmailVerified,
    CreatedAt,
    UpdatedAt,
}
