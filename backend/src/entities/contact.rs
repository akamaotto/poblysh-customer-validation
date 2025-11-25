use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "contact")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub startup_id: Uuid,
    pub name: String,
    pub role: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub linkedin_url: Option<String>,
    pub is_primary: bool,
    pub notes: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::startup::Entity",
        from = "Column::StartupId",
        to = "super::startup::Column::Id"
    )]
    Startup,
}

impl Related<super::startup::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Startup.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
