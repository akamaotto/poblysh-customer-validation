use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(PasswordResetTokens::Table)
                    .if_not_exists()
                    .col(uuid(PasswordResetTokens::Id).primary_key())
                    .col(uuid(PasswordResetTokens::UserId).not_null())
                    .col(string(PasswordResetTokens::Token).unique_key().not_null())
                    .col(timestamp(PasswordResetTokens::ExpiresAt).not_null())
                    .col(boolean(PasswordResetTokens::Used).not_null().default(false))
                    .col(timestamp(PasswordResetTokens::CreatedAt).not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(PasswordResetTokens::Table, PasswordResetTokens::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create index on token for faster lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_password_reset_tokens_token")
                    .table(PasswordResetTokens::Table)
                    .col(PasswordResetTokens::Token)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PasswordResetTokens::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum PasswordResetTokens {
    Table,
    Id,
    UserId,
    Token,
    ExpiresAt,
    Used,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
