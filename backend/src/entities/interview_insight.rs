use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "interview_insight")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub interview_id: Uuid,
    pub current_workflow: Option<String>,
    pub biggest_pains: Option<serde_json::Value>,
    pub desired_outcomes: Option<serde_json::Value>,
    pub jtbd_functional: Option<String>,
    pub jtbd_social: Option<String>,
    pub jtbd_emotional: Option<String>,
    pub excited_features: Option<serde_json::Value>,
    pub ignored_features: Option<serde_json::Value>,
    pub main_objections: Option<serde_json::Value>,
    pub interest_level: String,
    pub real_owner_role: Option<String>,
    pub willing_to_use_monthly: Option<String>,
    pub activation_candidate: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::interview::Entity",
        from = "Column::InterviewId",
        to = "super::interview::Column::Id"
    )]
    Interview,
}

impl Related<super::interview::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Interview.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
