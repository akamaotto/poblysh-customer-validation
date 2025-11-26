use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "email_provider_settings")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub domain: String,
    pub imap_host: String,
    pub imap_port: i32,
    pub imap_security: String,
    pub smtp_host: String,
    pub smtp_port: i32,
    pub smtp_security: String,
    pub provider: String,
    pub require_app_password: bool,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::email_credential::Entity")]
    EmailCredentials,
}

impl Related<super::email_credential::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EmailCredentials.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
