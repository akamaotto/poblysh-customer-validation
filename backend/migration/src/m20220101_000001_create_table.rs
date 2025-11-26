use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create Startup table
        manager
            .create_table(
                Table::create()
                    .table(Startup::Table)
                    .if_not_exists()
                    .col(uuid(Startup::Id).primary_key())
                    .col(string(Startup::Name))
                    .col(string_null(Startup::Category))
                    .col(string_null(Startup::Website))
                    .col(string_null(Startup::NewsroomUrl))
                    .col(string(Startup::Status))
                    .col(timestamp_null(Startup::LastContactDate))
                    .col(string_null(Startup::NextStep))
                    .col(boolean(Startup::AdminClaimed).default(false))
                    .col(timestamp(Startup::CreatedAt))
                    .col(timestamp(Startup::UpdatedAt))
                    .to_owned(),
            )
            .await?;

        // Create Contact table
        manager
            .create_table(
                Table::create()
                    .table(Contact::Table)
                    .if_not_exists()
                    .col(uuid(Contact::Id).primary_key())
                    .col(uuid(Contact::StartupId))
                    .col(string(Contact::Name))
                    .col(string(Contact::Role))
                    .col(string_null(Contact::Email))
                    .col(string_null(Contact::Phone))
                    .col(string_null(Contact::LinkedinUrl))
                    .col(boolean(Contact::IsPrimary).default(false))
                    .col(text_null(Contact::Notes))
                    .foreign_key(
                        ForeignKey::create()
                            .from(Contact::Table, Contact::StartupId)
                            .to(Startup::Table, Startup::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create OutreachLog table
        manager
            .create_table(
                Table::create()
                    .table(OutreachLog::Table)
                    .if_not_exists()
                    .col(uuid(OutreachLog::Id).primary_key())
                    .col(uuid(OutreachLog::StartupId))
                    .col(uuid_null(OutreachLog::ContactId))
                    .col(string(OutreachLog::Channel))
                    .col(string(OutreachLog::Direction))
                    .col(text_null(OutreachLog::MessageSummary))
                    .col(string_null(OutreachLog::MessageId))
                    .col(string_null(OutreachLog::Subject))
                    .col(string_null(OutreachLog::DeliveryStatus))
                    .col(timestamp(OutreachLog::Date))
                    .col(string(OutreachLog::Outcome))
                    .foreign_key(
                        ForeignKey::create()
                            .from(OutreachLog::Table, OutreachLog::StartupId)
                            .to(Startup::Table, Startup::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(OutreachLog::Table, OutreachLog::ContactId)
                            .to(Contact::Table, Contact::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        // Create Interview table
        manager
            .create_table(
                Table::create()
                    .table(Interview::Table)
                    .if_not_exists()
                    .col(uuid(Interview::Id).primary_key())
                    .col(uuid(Interview::StartupId))
                    .col(uuid_null(Interview::ContactId))
                    .col(timestamp(Interview::Date))
                    .col(string(Interview::Type))
                    .col(string_null(Interview::RecordingUrl))
                    .col(string_null(Interview::TranscriptUrl))
                    .col(text_null(Interview::Summary))
                    .foreign_key(
                        ForeignKey::create()
                            .from(Interview::Table, Interview::StartupId)
                            .to(Startup::Table, Startup::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Interview::Table, Interview::ContactId)
                            .to(Contact::Table, Contact::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        // Create InterviewInsight table
        manager
            .create_table(
                Table::create()
                    .table(InterviewInsight::Table)
                    .if_not_exists()
                    .col(uuid(InterviewInsight::Id).primary_key())
                    .col(uuid(InterviewInsight::InterviewId))
                    .col(text_null(InterviewInsight::CurrentWorkflow))
                    .col(json_null(InterviewInsight::BiggestPains))
                    .col(json_null(InterviewInsight::DesiredOutcomes))
                    .col(text_null(InterviewInsight::JtbdFunctional))
                    .col(text_null(InterviewInsight::JtbdSocial))
                    .col(text_null(InterviewInsight::JtbdEmotional))
                    .col(json_null(InterviewInsight::ExcitedFeatures))
                    .col(json_null(InterviewInsight::IgnoredFeatures))
                    .col(json_null(InterviewInsight::MainObjections))
                    .col(string(InterviewInsight::InterestLevel))
                    .col(string_null(InterviewInsight::RealOwnerRole))
                    .col(string_null(InterviewInsight::WillingToUseMonthly))
                    .col(boolean(InterviewInsight::ActivationCandidate).default(false))
                    .foreign_key(
                        ForeignKey::create()
                            .from(InterviewInsight::Table, InterviewInsight::InterviewId)
                            .to(Interview::Table, Interview::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create WeeklySynthesis table
        manager
            .create_table(
                Table::create()
                    .table(WeeklySynthesis::Table)
                    .if_not_exists()
                    .col(uuid(WeeklySynthesis::Id).primary_key())
                    .col(date(WeeklySynthesis::WeekStartDate))
                    .col(date(WeeklySynthesis::WeekEndDate))
                    .col(text_null(WeeklySynthesis::TopPains))
                    .col(text_null(WeeklySynthesis::TopDesiredOutcomes))
                    .col(text_null(WeeklySynthesis::TopFeatures))
                    .col(text_null(WeeklySynthesis::TopObjections))
                    .col(text_null(WeeklySynthesis::OwnerPersonaSummary))
                    .col(text_null(WeeklySynthesis::ActivationSummary))
                    .col(text_null(WeeklySynthesis::ProductImplications))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(WeeklySynthesis::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(InterviewInsight::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Interview::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(OutreachLog::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Contact::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Startup::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
pub enum Startup {
    Table,
    Id,
    Name,
    Category,
    Website,
    NewsroomUrl,
    Status,
    LastContactDate,
    NextStep,
    AdminClaimed,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum Contact {
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
}

#[derive(DeriveIden)]
pub enum OutreachLog {
    Table,
    Id,
    StartupId,
    ContactId,
    Channel,
    Direction,
    MessageSummary,
    MessageId,
    Subject,
    DeliveryStatus,
    Date,
    Outcome,
}

#[derive(DeriveIden)]
pub enum Interview {
    Table,
    Id,
    StartupId,
    ContactId,
    Date,
    Type,
    RecordingUrl,
    TranscriptUrl,
    Summary,
}

#[derive(DeriveIden)]
pub enum InterviewInsight {
    Table,
    Id,
    InterviewId,
    CurrentWorkflow,
    BiggestPains,
    DesiredOutcomes,
    JtbdFunctional,
    JtbdSocial,
    JtbdEmotional,
    ExcitedFeatures,
    IgnoredFeatures,
    MainObjections,
    InterestLevel,
    RealOwnerRole,
    WillingToUseMonthly,
    ActivationCandidate,
}

#[derive(DeriveIden)]
pub enum WeeklySynthesis {
    Table,
    Id,
    WeekStartDate,
    WeekEndDate,
    TopPains,
    TopDesiredOutcomes,
    TopFeatures,
    TopObjections,
    OwnerPersonaSummary,
    ActivationSummary,
    ProductImplications,
}
