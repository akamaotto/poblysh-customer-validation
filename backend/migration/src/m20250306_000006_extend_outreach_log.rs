use sea_orm_migration::prelude::*;

#[derive(DeriveIden)]
enum OutreachLog {
    Table,
    MessageId,
    Subject,
    DeliveryStatus,
}

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OutreachLog::Table)
                    .add_column_if_not_exists(
                        ColumnDef::new(OutreachLog::MessageId)
                            .string()
                            .null()
                            .to_owned(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(OutreachLog::Subject)
                            .string()
                            .null()
                            .to_owned(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(OutreachLog::DeliveryStatus)
                            .string()
                            .null()
                            .to_owned(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OutreachLog::Table)
                    .drop_column(OutreachLog::MessageId)
                    .drop_column(OutreachLog::Subject)
                    .drop_column(OutreachLog::DeliveryStatus)
                    .to_owned(),
            )
            .await
    }
}
