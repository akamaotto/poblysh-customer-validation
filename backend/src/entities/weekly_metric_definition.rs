use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "weekly_metric_definition")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub plan_id: Uuid,
    pub metric_type: String,
    pub name: String,
    pub unit_label: String,
    pub owner_name: Option<String>,
    pub owner_id: Option<Uuid>,
    pub target_value: i32,
    pub actual_value: i32,
    pub activity_type: Option<String>,
    pub stage_name: Option<String>,
    pub sort_order: i32,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::weekly_activity_plan::Entity",
        from = "Column::PlanId",
        to = "super::weekly_activity_plan::Column::Id",
        on_delete = "Cascade"
    )]
    Plan,
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::OwnerId",
        to = "super::user::Column::Id",
        on_delete = "SetNull"
    )]
    Owner,
}

impl Related<super::weekly_activity_plan::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Plan.def()
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Owner.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
