use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(WeeklyActivityPlan::Table)
                    .if_not_exists()
                    .col(uuid(WeeklyActivityPlan::Id).primary_key())
                    .col(date(WeeklyActivityPlan::WeekStart))
                    .col(date(WeeklyActivityPlan::WeekEnd))
                    .col(string(WeeklyActivityPlan::Status).default("draft"))
                    .col(uuid_null(WeeklyActivityPlan::CreatedBy))
                    .col(timestamp(WeeklyActivityPlan::CreatedAt))
                    .col(timestamp(WeeklyActivityPlan::UpdatedAt))
                    .col(timestamp_null(WeeklyActivityPlan::ClosedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                WeeklyActivityPlan::Table,
                                WeeklyActivityPlan::CreatedBy,
                            )
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_weekly_activity_plan_week")
                    .table(WeeklyActivityPlan::Table)
                    .col(WeeklyActivityPlan::WeekStart)
                    .col(WeeklyActivityPlan::WeekEnd)
                    .unique()
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(WeeklyMetricDefinition::Table)
                    .if_not_exists()
                    .col(uuid(WeeklyMetricDefinition::Id).primary_key())
                    .col(uuid(WeeklyMetricDefinition::PlanId))
                    .col(string(WeeklyMetricDefinition::MetricType))
                    .col(string(WeeklyMetricDefinition::Name))
                    .col(string(WeeklyMetricDefinition::UnitLabel))
                    .col(string_null(WeeklyMetricDefinition::OwnerName))
                    .col(uuid_null(WeeklyMetricDefinition::OwnerId))
                    .col(integer(WeeklyMetricDefinition::TargetValue).default(0))
                    .col(integer(WeeklyMetricDefinition::ActualValue).default(0))
                    .col(string_null(WeeklyMetricDefinition::ActivityType))
                    .col(string_null(WeeklyMetricDefinition::StageName))
                    .col(integer(WeeklyMetricDefinition::SortOrder).default(0))
                    .col(timestamp(WeeklyMetricDefinition::CreatedAt))
                    .col(timestamp(WeeklyMetricDefinition::UpdatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                WeeklyMetricDefinition::Table,
                                WeeklyMetricDefinition::PlanId,
                            )
                            .to(
                                WeeklyActivityPlan::Table,
                                WeeklyActivityPlan::Id,
                            )
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                WeeklyMetricDefinition::Table,
                                WeeklyMetricDefinition::OwnerId,
                            )
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_weekly_metric_definition_plan")
                    .table(WeeklyMetricDefinition::Table)
                    .col(WeeklyMetricDefinition::PlanId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(WeeklyActivityEvent::Table)
                    .if_not_exists()
                    .col(uuid(WeeklyActivityEvent::Id).primary_key())
                    .col(string(WeeklyActivityEvent::ActivityType))
                    .col(text(WeeklyActivityEvent::Description))
                    .col(timestamp(WeeklyActivityEvent::OccurredAt))
                    .col(uuid_null(WeeklyActivityEvent::UserId))
                    .col(string_null(WeeklyActivityEvent::UserName))
                    .col(uuid_null(WeeklyActivityEvent::StartupId))
                    .col(string_null(WeeklyActivityEvent::StartupName))
                    .col(uuid_null(WeeklyActivityEvent::ContactId))
                    .col(string_null(WeeklyActivityEvent::ContactName))
                    .col(string_null(WeeklyActivityEvent::StageFrom))
                    .col(string_null(WeeklyActivityEvent::StageTo))
                    .col(json_null(WeeklyActivityEvent::Metadata))
                    .col(timestamp(WeeklyActivityEvent::CreatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                WeeklyActivityEvent::Table,
                                WeeklyActivityEvent::UserId,
                            )
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                WeeklyActivityEvent::Table,
                                WeeklyActivityEvent::StartupId,
                            )
                            .to(Startup::Table, Startup::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                WeeklyActivityEvent::Table,
                                WeeklyActivityEvent::ContactId,
                            )
                            .to(Contact::Table, Contact::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_weekly_activity_event_occurred_at")
                    .table(WeeklyActivityEvent::Table)
                    .col(WeeklyActivityEvent::OccurredAt)
                    .col(WeeklyActivityEvent::ActivityType)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_weekly_activity_event_startup")
                    .table(WeeklyActivityEvent::Table)
                    .col(WeeklyActivityEvent::StartupId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table(WeeklyActivityEvent::Table)
                    .if_exists()
                    .to_owned(),
            )
            .await?;
        manager
            .drop_table(
                Table::drop()
                    .table(WeeklyMetricDefinition::Table)
                    .if_exists()
                    .to_owned(),
            )
            .await?;
        manager
            .drop_table(
                Table::drop()
                    .table(WeeklyActivityPlan::Table)
                    .if_exists()
                    .to_owned(),
            )
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum WeeklyActivityPlan {
    Table,
    Id,
    WeekStart,
    WeekEnd,
    Status,
    CreatedBy,
    CreatedAt,
    UpdatedAt,
    ClosedAt,
}

#[derive(DeriveIden)]
enum WeeklyMetricDefinition {
    Table,
    Id,
    PlanId,
    MetricType,
    Name,
    UnitLabel,
    OwnerName,
    OwnerId,
    TargetValue,
    ActualValue,
    ActivityType,
    StageName,
    SortOrder,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum WeeklyActivityEvent {
    Table,
    Id,
    ActivityType,
    Description,
    OccurredAt,
    UserId,
    UserName,
    StartupId,
    StartupName,
    ContactId,
    ContactName,
    StageFrom,
    StageTo,
    Metadata,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Startup {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Contact {
    Table,
    Id,
}
