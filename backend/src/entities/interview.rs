use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "interview")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub startup_id: Uuid,
    pub contact_id: Option<Uuid>,
    pub date: DateTime,
    #[sea_orm(column_name = "type")]
    pub interview_type: String,
    pub recording_url: Option<String>,
    pub transcript_url: Option<String>,
    pub summary: Option<String>,
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
    #[sea_orm(has_one = "super::interview_insight::Entity")]
    InterviewInsight,
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

impl Related<super::interview_insight::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::InterviewInsight.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
