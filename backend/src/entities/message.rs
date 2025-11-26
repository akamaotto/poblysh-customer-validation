use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "messages")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub user_id: Uuid,
    pub sender_name: Option<String>,
    pub sender_email: String,
    pub subject: String,
    #[sea_orm(column_type = "Text")]
    pub body_text: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub body_html: Option<String>,
    pub direction: String,
    pub to_emails: Json,
    pub cc_emails: Json,
    pub bcc_emails: Json,
    pub sent_at: DateTimeWithTimeZone,
    pub delivered_at: DateTimeWithTimeZone,
    pub read_at: Option<DateTimeWithTimeZone>,
    pub is_read: bool,
    pub is_from_me: bool,
    pub imap_uid: Option<i32>,
    pub message_id_header: Option<String>,
    pub in_reply_to: Option<String>,
    pub references: Option<String>,
    pub snippet: Option<String>,
    pub has_attachments: bool,
    pub attachment_count: i32,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::conversation::Entity",
        from = "Column::ConversationId",
        to = "super::conversation::Column::Id"
    )]
    Conversation,
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
    #[sea_orm(has_many = "super::email_attachment::Entity")]
    Attachments,
}

impl Related<super::conversation::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Conversation.def()
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::email_attachment::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Attachments.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
