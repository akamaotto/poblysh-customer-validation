use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "startup")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name: String,
    pub category: Option<String>,
    pub website: Option<String>,
    pub newsroom_url: Option<String>,
    pub status: String,
    pub last_contact_date: Option<DateTime>,
    pub next_step: Option<String>,
    pub admin_claimed: bool,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::contact::Entity")]
    Contact,
    #[sea_orm(has_many = "super::outreach_log::Entity")]
    OutreachLog,
    #[sea_orm(has_many = "super::interview::Entity")]
    Interview,
}

impl Related<super::contact::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Contact.def()
    }
}

impl Related<super::outreach_log::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::OutreachLog.def()
    }
}

impl Related<super::interview::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Interview.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
