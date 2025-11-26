use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "email_credentials")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub user_id: Uuid,
    pub email: String,
    pub imap_host: String,
    pub imap_port: i32,
    pub smtp_host: String,
    pub smtp_port: i32,
    // Encrypted fields stored as base64 strings
    pub encrypted_password: String,
    pub nonce: String,
    pub provider_settings_id: Option<Uuid>,
    pub sync_status: String,
    pub sync_enabled: bool,
    pub last_synced_at: Option<DateTimeWithTimeZone>,
    pub last_sync_attempt_at: Option<DateTimeWithTimeZone>,
    pub last_sync_error: Option<String>,
    pub sync_cursor: Option<i32>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
    #[sea_orm(
        belongs_to = "super::email_provider_setting::Entity",
        from = "Column::ProviderSettingsId",
        to = "super::email_provider_setting::Column::Id"
    )]
    ProviderSettings,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::email_provider_setting::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ProviderSettings.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
