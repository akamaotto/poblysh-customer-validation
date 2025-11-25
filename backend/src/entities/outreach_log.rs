use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "outreach_log")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub startup_id: Uuid,
    pub contact_id: Option<Uuid>,
    pub channel: String,
    pub direction: String,
    pub message_summary: Option<String>,
    pub date: DateTime,
    pub outcome: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::startup::Entity",
        from = "Column::StartupId",
        to = "super::startup::Column::Id"
    )]
    Startup,
    #[sea_orm(
        belongs_to = "super::contact::Entity",
        from = "Column::ContactId",
        to = "super::contact::Column::Id"
    )]
    Contact,
}

impl Related<super::startup::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Startup.def()
    }
}

impl Related<super::contact::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Contact.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
