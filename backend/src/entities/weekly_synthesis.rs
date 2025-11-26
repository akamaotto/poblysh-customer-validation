use chrono::NaiveDate;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "weekly_synthesis")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub week_start_date: NaiveDate,
    pub week_end_date: NaiveDate,
    pub top_pains: Option<String>,
    pub top_desired_outcomes: Option<String>,
    pub top_features: Option<String>,
    pub top_objections: Option<String>,
    pub owner_persona_summary: Option<String>,
    pub activation_summary: Option<String>,
    pub product_implications: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
