use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "weekly_activity_event")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub activity_type: String,
    pub description: String,
    pub occurred_at: DateTime,
    pub user_id: Option<Uuid>,
    pub user_name: Option<String>,
    pub startup_id: Option<Uuid>,
    pub startup_name: Option<String>,
    pub contact_id: Option<Uuid>,
    pub contact_name: Option<String>,
    pub stage_from: Option<String>,
    pub stage_to: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id",
        on_delete = "SetNull"
    )]
    User,
    #[sea_orm(
        belongs_to = "super::startup::Entity",
        from = "Column::StartupId",
        to = "super::startup::Column::Id",
        on_delete = "SetNull"
    )]
    Startup,
    #[sea_orm(
        belongs_to = "super::contact::Entity",
        from = "Column::ContactId",
        to = "super::contact::Column::Id",
        on_delete = "SetNull"
    )]
    Contact,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
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
