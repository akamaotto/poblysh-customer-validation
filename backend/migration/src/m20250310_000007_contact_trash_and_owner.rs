use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Contact::Table)
                    .add_column_if_not_exists(boolean(Contact::IsTrashed).default(false))
                    .add_column_if_not_exists(uuid_null(Contact::OwnerId))
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk-contact-owner")
                            .from_tbl(Contact::Table)
                            .from_col(Contact::OwnerId)
                            .to_tbl(Users::Table)
                            .to_col(Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Contact::Table)
                    .drop_foreign_key(Alias::new("fk-contact-owner"))
                    .drop_column(Contact::OwnerId)
                    .drop_column(Contact::IsTrashed)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Contact {
    Table,
    Id,
    StartupId,
    Name,
    Role,
    Email,
    Phone,
    LinkedinUrl,
    IsPrimary,
    Notes,
    IsTrashed,
    OwnerId,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
