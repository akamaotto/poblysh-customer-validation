use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub email: String,
    pub password_hash: String,
    pub name: Option<String>,
    pub role: String, // "admin" or "user"
    pub is_active: bool,
    pub email_verified: bool,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::session::Entity")]
    Sessions,
    #[sea_orm(has_many = "super::password_reset_token::Entity")]
    PasswordResetTokens,
}

impl Related<super::session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Sessions.def()
    }
}

impl Related<super::password_reset_token::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PasswordResetTokens.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

// Helper methods for user roles
impl Model {
    pub fn is_admin(&self) -> bool {
        self.role == "admin"
    }

    #[allow(dead_code)]
    pub fn is_user(&self) -> bool {
        self.role == "user"
    }
}
