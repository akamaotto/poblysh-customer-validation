use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Sessions::Table)
                    .if_not_exists()
                    .col(uuid(Sessions::Id).primary_key())
                    .col(uuid(Sessions::UserId).not_null())
                    .col(string(Sessions::Token).unique_key().not_null())
                    .col(timestamp(Sessions::ExpiresAt).not_null())
                    .col(timestamp(Sessions::CreatedAt).not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(Sessions::Table, Sessions::UserId)
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
                    .name("idx_sessions_token")
                    .table(Sessions::Table)
                    .col(Sessions::Token)
                    .to_owned(),
            )
            .await?;

        // Create index on user_id for faster user session queries
        manager
            .create_index(
                Index::create()
                    .name("idx_sessions_user_id")
                    .table(Sessions::Table)
                    .col(Sessions::UserId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Sessions::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Sessions {
    Table,
    Id,
    UserId,
    Token,
    ExpiresAt,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
