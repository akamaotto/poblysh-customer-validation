use crate::auth::middleware::{AdminUser, AuthUser};
use crate::entities::{
    conversation, email_attachment, email_credential, email_provider_setting, message, user,
};
use crate::services::encryption_service::EncryptionService;
use crate::services::imap_service::ImapService;
use crate::services::smtp_service::{OutgoingAttachment, SmtpService};
use crate::AppState;
use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::Response,
    Json,
};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::{FixedOffset, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashSet;
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Serialize)]
pub struct EmailConfigResponse {
    pub email: String,
    pub imap_host: String,
    pub imap_port: i32,
    pub smtp_host: String,
    pub smtp_port: i32,
    pub is_configured: bool,
    pub sync_status: Option<String>,
    pub last_synced_at: Option<String>,
    pub last_error: Option<String>,
    pub provider_defaults: Option<AdminEmailConfigResponse>,
}

#[derive(Deserialize)]
pub struct EmailConfigDto {
    pub email: String,
    #[serde(default)]
    pub password: Option<String>,
    pub imap_host: String,
    pub imap_port: i32,
    pub smtp_host: String,
    pub smtp_port: i32,
    pub provider_settings_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct EmailStatusResponse {
    pub sync_status: String,
    pub last_synced_at: Option<String>,
    pub last_sync_error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AdminEmailConfigResponse {
    pub id: Uuid,
    pub domain: String,
    pub imap_host: String,
    pub imap_port: i32,
    pub imap_security: String,
    pub smtp_host: String,
    pub smtp_port: i32,
    pub smtp_security: String,
    pub provider: String,
    pub require_app_password: bool,
}

#[derive(Deserialize)]
pub struct AdminEmailConfigDto {
    pub domain: String,
    pub imap_host: String,
    pub imap_port: i32,
    #[serde(default = "default_security")]
    pub imap_security: String,
    pub smtp_host: String,
    pub smtp_port: i32,
    #[serde(default = "default_security")]
    pub smtp_security: String,
    #[serde(default = "default_provider")]
    pub provider: String,
    #[serde(default)]
    pub require_app_password: bool,
}

#[derive(Deserialize, Default)]
pub struct ConversationListQuery {
    pub show_all: Option<bool>,
    pub startup_id: Option<Uuid>,
    pub unread_only: Option<bool>,
    pub has_attachments: Option<bool>,
    pub search: Option<String>,
    pub participant: Option<String>,
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub archived: Option<bool>,
}

#[derive(Clone, Serialize)]
pub struct ConversationSummary {
    pub conversation: conversation::Model,
    pub owner_name: Option<String>,
    pub owner_email: Option<String>,
}

#[derive(Serialize)]
pub struct ConversationDetailResponse {
    pub conversation: conversation::Model,
    pub messages: Vec<MessageResponse>,
}

#[derive(Serialize)]
pub struct MessageResponse {
    pub message: message::Model,
    pub attachments: Vec<AttachmentResponse>,
}

#[derive(Serialize)]
pub struct AttachmentResponse {
    pub id: Uuid,
    pub file_name: String,
    pub content_type: String,
    pub size_bytes: i64,
    pub is_inline: bool,
    pub content_id: Option<String>,
}

#[derive(Deserialize)]
pub struct SendReplyRequest {
    #[serde(default)]
    pub body_text: Option<String>,
    #[serde(default)]
    pub body_html: Option<String>,
    #[serde(default)]
    pub to: Vec<String>,
    #[serde(default)]
    pub cc: Vec<String>,
    #[serde(default)]
    pub bcc: Vec<String>,
    #[serde(default)]
    pub attachments: Vec<AttachmentUpload>,
}

#[derive(Deserialize)]
pub struct AttachmentUpload {
    pub file_name: String,
    pub content_type: String,
    pub data_base64: String,
    #[serde(default)]
    pub is_inline: bool,
    pub content_id: Option<String>,
}

fn default_security() -> String {
    "ssl".to_string()
}

fn default_provider() -> String {
    "custom".to_string()
}

pub async fn list_admin_email_configs(
    State(state): State<AppState>,
    AdminUser(_): AdminUser,
) -> Result<Json<Vec<AdminEmailConfigResponse>>, StatusCode> {
    ensure_stackmail_provider(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let configs = email_provider_setting::Entity::find()
        .order_by_asc(email_provider_setting::Column::Domain)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = configs
        .into_iter()
        .map(AdminEmailConfigResponse::from)
        .collect();
    Ok(Json(response))
}

pub async fn save_admin_email_config(
    State(state): State<AppState>,
    AdminUser(_): AdminUser,
    Json(payload): Json<AdminEmailConfigDto>,
) -> Result<Json<AdminEmailConfigResponse>, StatusCode> {
    let existing = email_provider_setting::Entity::find()
        .filter(email_provider_setting::Column::Domain.eq(&payload.domain))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let now = utc_now();
    let model = if let Some(existing) = existing {
        let mut active: email_provider_setting::ActiveModel = existing.into();
        active.imap_host = Set(payload.imap_host);
        active.imap_port = Set(payload.imap_port);
        active.imap_security = Set(payload.imap_security);
        active.smtp_host = Set(payload.smtp_host);
        active.smtp_port = Set(payload.smtp_port);
        active.smtp_security = Set(payload.smtp_security);
        active.provider = Set(payload.provider);
        active.require_app_password = Set(payload.require_app_password);
        active.updated_at = Set(now);
        active
            .update(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        let active = email_provider_setting::ActiveModel {
            id: Set(Uuid::new_v4()),
            domain: Set(payload.domain),
            imap_host: Set(payload.imap_host),
            imap_port: Set(payload.imap_port),
            imap_security: Set(payload.imap_security),
            smtp_host: Set(payload.smtp_host),
            smtp_port: Set(payload.smtp_port),
            smtp_security: Set(payload.smtp_security),
            provider: Set(payload.provider),
            require_app_password: Set(payload.require_app_password),
            created_at: Set(now),
            updated_at: Set(now),
        };
        active
            .insert(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    };

    Ok(Json(AdminEmailConfigResponse::from(model)))
}

pub async fn get_email_config(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<EmailConfigResponse>, StatusCode> {
    let creds = email_credential::Entity::find()
        .filter(email_credential::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .map_err(|err| {
            error!(error = ?err, user_id = %user.id, "failed to query email credentials");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let provider = provider_defaults(&state.db, &user.email).await;

    if let Some(creds) = creds {
        info!(user_id = %user.id, "returning stored email configuration");
        Ok(Json(EmailConfigResponse {
            email: creds.email.clone(),
            imap_host: creds.imap_host.clone(),
            imap_port: creds.imap_port,
            smtp_host: creds.smtp_host.clone(),
            smtp_port: creds.smtp_port,
            is_configured: true,
            sync_status: Some(creds.sync_status.clone()),
            last_synced_at: creds.last_synced_at.map(|dt| dt.to_rfc3339()),
            last_error: creds.last_sync_error.clone(),
            provider_defaults: provider.clone(),
        }))
    } else {
        info!(user_id = %user.id, "no email credentials stored");
        Ok(Json(EmailConfigResponse {
            email: user.email.clone(),
            imap_host: provider
                .as_ref()
                .map(|p| p.imap_host.clone())
                .unwrap_or_default(),
            imap_port: provider.as_ref().map(|p| p.imap_port).unwrap_or(993),
            smtp_host: provider
                .as_ref()
                .map(|p| p.smtp_host.clone())
                .unwrap_or_default(),
            smtp_port: provider.as_ref().map(|p| p.smtp_port).unwrap_or(587),
            is_configured: false,
            sync_status: None,
            last_synced_at: None,
            last_error: None,
            provider_defaults: provider,
        }))
    }
}

pub async fn save_email_config(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(payload): Json<EmailConfigDto>,
) -> Result<StatusCode, StatusCode> {
    let encryption_service = EncryptionService::new();
    let imap_service = ImapService::new(state.db.clone(), EncryptionService::new());

    let password = payload.password.clone().ok_or_else(|| {
        warn!(user_id = %user.id, "missing password when saving email config");
        StatusCode::BAD_REQUEST
    })?;

    if let Err(err) = imap_service
        .test_credentials(
            &payload.email,
            &password,
            &payload.imap_host,
            payload.imap_port,
        )
        .await
    {
        warn!(user_id = %user.id, error = %err, "email credential test failed");
        return Err(StatusCode::BAD_REQUEST);
    }

    let (encrypted_password, nonce) = encryption_service.encrypt(&password);

    let existing = email_credential::Entity::find()
        .filter(email_credential::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .map_err(|err| {
            error!(error = ?err, user_id = %user.id, "failed to query existing credentials");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let provider_id = if let Some(id) = payload.provider_settings_id {
        Some(id)
    } else {
        provider_defaults(&state.db, &payload.email)
            .await
            .map(|p| p.id)
    };
    let now = utc_now();

    if let Some(existing) = existing {
        let mut active: email_credential::ActiveModel = existing.into();
        active.email = Set(payload.email);
        active.imap_host = Set(payload.imap_host);
        active.imap_port = Set(payload.imap_port);
        active.smtp_host = Set(payload.smtp_host);
        active.smtp_port = Set(payload.smtp_port);
        active.provider_settings_id = Set(provider_id);
        active.encrypted_password = Set(encrypted_password);
        active.nonce = Set(nonce);
        active.sync_status = Set("connected".to_string());
        active.updated_at = Set(now);
        active.update(&state.db).await.map_err(|err| {
            error!(error = ?err, user_id = %user.id, "failed to update email credentials");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        info!(user_id = %user.id, "updated email credentials");
    } else {
        let model = email_credential::ActiveModel {
            id: Set(Uuid::new_v4()),
            user_id: Set(user.id),
            email: Set(payload.email),
            imap_host: Set(payload.imap_host),
            imap_port: Set(payload.imap_port),
            smtp_host: Set(payload.smtp_host),
            smtp_port: Set(payload.smtp_port),
            provider_settings_id: Set(provider_id),
            encrypted_password: Set(encrypted_password),
            nonce: Set(nonce),
            sync_status: Set("connected".to_string()),
            sync_enabled: Set(true),
            last_synced_at: Set(None),
            last_sync_attempt_at: Set(Some(now)),
            last_sync_error: Set(None),
            sync_cursor: Set(None),
            created_at: Set(now),
            updated_at: Set(now),
        };
        model.insert(&state.db).await.map_err(|err| {
            error!(error = ?err, user_id = %user.id, "failed to insert email credentials");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        info!(user_id = %user.id, "created email credentials");
    }

    Ok(StatusCode::OK)
}

pub async fn test_email_credentials(
    State(state): State<AppState>,
    AuthUser(_): AuthUser,
    Json(payload): Json<EmailConfigDto>,
) -> Result<StatusCode, StatusCode> {
    let password = payload.password.clone().ok_or_else(|| {
        warn!("test email credentials called without password");
        StatusCode::BAD_REQUEST
    })?;
    let encryption_service = EncryptionService::new();
    let imap_service = ImapService::new(state.db.clone(), encryption_service);
    imap_service
        .test_credentials(
            &payload.email,
            &password,
            &payload.imap_host,
            payload.imap_port,
        )
        .await
        .map_err(|err| {
            warn!(error = %err, "test email credentials failed");
            StatusCode::BAD_REQUEST
        })?;
    Ok(StatusCode::OK)
}

pub async fn get_email_status(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<EmailStatusResponse>, StatusCode> {
    let creds = email_credential::Entity::find()
        .filter(email_credential::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(creds) = creds {
        Ok(Json(EmailStatusResponse {
            sync_status: creds.sync_status,
            last_synced_at: creds.last_synced_at.map(|dt| dt.to_rfc3339()),
            last_sync_error: creds.last_sync_error,
        }))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

pub async fn sync_emails(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<StatusCode, StatusCode> {
    let has_credentials = email_credential::Entity::find()
        .filter(email_credential::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .is_some();

    if !has_credentials {
        warn!(user_id = %user.id, "manual email sync requested without configured credentials");
        return Err(StatusCode::BAD_REQUEST);
    }

    let encryption_service = EncryptionService::new();
    let imap_service = ImapService::new(state.db.clone(), encryption_service);

    imap_service
        .sync_user_emails(user.id)
        .await
        .map_err(|err| {
            error!(error = %err, user_id = %user.id, "manual email sync failed");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::OK)
}

pub async fn list_conversations(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(params): Query<ConversationListQuery>,
) -> Result<Json<Vec<ConversationSummary>>, StatusCode> {
    let mut query = conversation::Entity::find();

    let show_all = params.show_all.unwrap_or(false) && user.role == "admin";

    if !show_all {
        query = query.filter(conversation::Column::UserId.eq(user.id));
    }

    if let Some(startup_id) = params.startup_id {
        query = query.filter(conversation::Column::StartupId.eq(startup_id));
    }

    if params.unread_only.unwrap_or(false) {
        query = query.filter(conversation::Column::UnreadCount.gt(0));
    }

    if let Some(flag) = params.has_attachments {
        query = query.filter(conversation::Column::HasAttachments.eq(flag));
    }

    let archived = params.archived.unwrap_or(false);
    query = query.filter(conversation::Column::IsArchived.eq(archived));

    query = query.order_by_desc(conversation::Column::LatestMessageAt);

    let results = query
        .find_also_related(user::Entity)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let filtered = in_memory_filter(results, &params);

    Ok(Json(filtered))
}

pub async fn get_conversation(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ConversationDetailResponse>, StatusCode> {
    let conversation = conversation::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if conversation.user_id != user.id && user.role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    let messages = message::Entity::find()
        .filter(message::Column::ConversationId.eq(id))
        .order_by_asc(message::Column::SentAt)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let attachments = email_attachment::Entity::find()
        .filter(
            email_attachment::Column::MessageId
                .is_in(messages.iter().map(|m| m.id).collect::<Vec<_>>()),
        )
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let attachment_map =
        attachments
            .into_iter()
            .fold(std::collections::HashMap::new(), |mut acc, item| {
                acc.entry(item.message_id)
                    .or_insert_with(Vec::new)
                    .push(item);
                acc
            });

    let response_messages = messages
        .into_iter()
        .map(|msg| MessageResponse {
            attachments: attachment_map
                .get(&msg.id)
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(AttachmentResponse::from)
                .collect(),
            message: msg,
        })
        .collect();

    Ok(Json(ConversationDetailResponse {
        conversation,
        messages: response_messages,
    }))
}

pub async fn reply_to_conversation(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<SendReplyRequest>,
) -> Result<StatusCode, StatusCode> {
    send_message(state, user, id, payload, ReplyKind::Reply).await
}

pub async fn forward_conversation(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<SendReplyRequest>,
) -> Result<StatusCode, StatusCode> {
    send_message(state, user, id, payload, ReplyKind::Forward).await
}

pub async fn mark_conversation_read(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    update_conversation_flags(&state.db, user, id, true, false).await
}

pub async fn mark_conversation_unread(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    update_conversation_flags(&state.db, user, id, false, false).await
}

pub async fn archive_conversation(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    update_conversation_flags(&state.db, user, id, true, true).await
}

pub async fn unarchive_conversation(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    update_conversation_flags(&state.db, user, id, true, false).await
}

pub async fn download_attachment(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path((conversation_id, attachment_id)): Path<(Uuid, Uuid)>,
) -> Result<Response, StatusCode> {
    let conversation = conversation::Entity::find_by_id(conversation_id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if conversation.user_id != user.id && user.role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    let attachment = email_attachment::Entity::find_by_id(attachment_id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let message = message::Entity::find_by_id(attachment.message_id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if message.conversation_id != conversation_id {
        return Err(StatusCode::NOT_FOUND);
    }

    let mut response = Response::new(attachment.data.into());
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        attachment
            .content_type
            .parse()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );
    response.headers_mut().insert(
        header::CONTENT_DISPOSITION,
        format!("attachment; filename=\"{}\"", attachment.file_name)
            .parse()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );
    Ok(response)
}

async fn provider_defaults(
    db: &DatabaseConnection,
    email: &str,
) -> Option<AdminEmailConfigResponse> {
    let domain = email.split('@').nth(1)?.to_string();
    if let Ok(Some(model)) = email_provider_setting::Entity::find()
        .filter(email_provider_setting::Column::Domain.eq(domain))
        .one(db)
        .await
    {
        return Some(AdminEmailConfigResponse::from(model));
    }

    if ensure_stackmail_provider(db).await.is_err() {
        return None;
    }

    email_provider_setting::Entity::find()
        .filter(email_provider_setting::Column::Domain.eq(DEFAULT_PROVIDER_DOMAIN))
        .one(db)
        .await
        .ok()
        .flatten()
        .map(AdminEmailConfigResponse::from)
}

fn utc_now() -> chrono::DateTime<FixedOffset> {
    Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap())
}

fn in_memory_filter(
    items: Vec<(conversation::Model, Option<user::Model>)>,
    params: &ConversationListQuery,
) -> Vec<ConversationSummary> {
    let mut filtered = Vec::new();
    for (conversation, owner) in items {
        if let Some(participant) = params.participant.as_ref() {
            let participants = conversation
                .participants
                .as_array()
                .cloned()
                .unwrap_or_default();
            let matches = participants.iter().any(|value| {
                value
                    .get("email")
                    .and_then(Value::as_str)
                    .map(|email| email.contains(participant))
                    .unwrap_or(false)
            });
            if !matches {
                continue;
            }
        }

        if let Some(search) = params.search.as_ref() {
            let search = search.to_lowercase();
            let subject_match = conversation.subject.to_lowercase().contains(&search);
            let snippet_match = conversation
                .snippet
                .as_ref()
                .map(|s| s.to_lowercase().contains(&search))
                .unwrap_or(false);
            if !subject_match && !snippet_match {
                continue;
            }
        }

        filtered.push(ConversationSummary {
            owner_name: owner.as_ref().and_then(|o| o.name.clone()),
            owner_email: owner.as_ref().map(|o| o.email.clone()),
            conversation,
        });
    }

    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(25).max(1);
    let start = ((page - 1) * page_size) as usize;
    if start >= filtered.len() {
        return Vec::new();
    }
    let end = std::cmp::min(start + page_size as usize, filtered.len());
    filtered[start..end].to_vec()
}

enum ReplyKind {
    Reply,
    Forward,
}

async fn send_message(
    state: AppState,
    user: user::Model,
    conversation_id: Uuid,
    payload: SendReplyRequest,
    kind: ReplyKind,
) -> Result<StatusCode, StatusCode> {
    let conversation = conversation::Entity::find_by_id(conversation_id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if conversation.user_id != user.id {
        return Err(StatusCode::FORBIDDEN);
    }

    let creds = email_credential::Entity::find()
        .filter(email_credential::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::BAD_REQUEST)?;

    let smtp_service = SmtpService::new(state.db.clone(), EncryptionService::new());

    let to = determine_recipients(&conversation, &creds.email, &payload.to, &kind)?;
    if to.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let attachments = payload
        .attachments
        .iter()
        .map(|upload| to_outgoing_attachment(upload))
        .collect::<Result<Vec<_>, StatusCode>>()?;

    smtp_service
        .send_email(
            user.id,
            &to,
            &payload.cc,
            &payload.bcc,
            &conversation.subject,
            payload.body_text.as_deref(),
            payload.body_html.as_deref(),
            &attachments,
        )
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    persist_outgoing_message(
        &state.db,
        &conversation,
        &creds.email,
        &to,
        &payload.cc,
        &payload.bcc,
        payload.body_text,
        payload.body_html,
        attachments,
    )
    .await?;

    Ok(StatusCode::OK)
}

fn determine_recipients(
    conversation: &conversation::Model,
    user_email: &str,
    explicit: &[String],
    kind: &ReplyKind,
) -> Result<Vec<String>, StatusCode> {
    if !explicit.is_empty() {
        return Ok(explicit.to_vec());
    }

    let participants = parse_participants(&conversation.participants);
    let mut targets = HashSet::new();
    for participant in participants {
        if participant.email.eq_ignore_ascii_case(user_email) {
            continue;
        }
        if matches!(kind, ReplyKind::Reply) && participant.role == "from" {
            targets.insert(participant.email);
        } else if matches!(kind, ReplyKind::Forward) {
            targets.insert(participant.email);
        }
    }

    Ok(targets.into_iter().collect())
}

fn parse_participants(value: &Value) -> Vec<Participant> {
    value
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|entry| {
            Some(Participant {
                email: entry.get("email")?.as_str()?.to_string(),
                role: entry
                    .get("role")
                    .and_then(Value::as_str)
                    .unwrap_or("to")
                    .to_string(),
                name: entry
                    .get("name")
                    .and_then(Value::as_str)
                    .map(|s| s.to_string()),
            })
        })
        .collect()
}

struct Participant {
    email: String,
    role: String,
    name: Option<String>,
}

fn to_outgoing_attachment(payload: &AttachmentUpload) -> Result<OutgoingAttachment, StatusCode> {
    let data = STANDARD
        .decode(&payload.data_base64)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    Ok(OutgoingAttachment {
        file_name: payload.file_name.clone(),
        content_type: payload.content_type.clone(),
        data,
        is_inline: payload.is_inline,
        content_id: payload.content_id.clone(),
    })
}

async fn persist_outgoing_message(
    db: &DatabaseConnection,
    conversation: &conversation::Model,
    sender_email: &str,
    to: &[String],
    cc: &[String],
    bcc: &[String],
    body_text: Option<String>,
    body_html: Option<String>,
    attachments: Vec<OutgoingAttachment>,
) -> Result<(), StatusCode> {
    let now = utc_now();
    let has_new_attachments = !attachments.is_empty();
    let snippet = body_text
        .clone()
        .or(body_html.clone())
        .map(|body| truncate(&body));

    let message_model = message::ActiveModel {
        id: Set(Uuid::new_v4()),
        conversation_id: Set(conversation.id),
        user_id: Set(conversation.user_id),
        sender_name: Set(None),
        sender_email: Set(sender_email.to_string()),
        subject: Set(conversation.subject.clone()),
        body_text: Set(body_text),
        body_html: Set(body_html),
        direction: Set("sent".to_string()),
        to_emails: Set(addresses_to_json(to)),
        cc_emails: Set(addresses_to_json(cc)),
        bcc_emails: Set(addresses_to_json(bcc)),
        sent_at: Set(now),
        delivered_at: Set(now),
        read_at: Set(Some(now)),
        is_read: Set(true),
        is_from_me: Set(true),
        imap_uid: Set(None),
        message_id_header: Set(None),
        in_reply_to: Set(conversation.thread_id.clone()),
        references: Set(None),
        snippet: Set(snippet.clone()),
        has_attachments: Set(!attachments.is_empty()),
        attachment_count: Set(attachments.len() as i32),
        created_at: Set(now),
    };

    let inserted = message_model
        .insert(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    for attachment in &attachments {
        let model = email_attachment::ActiveModel {
            id: Set(Uuid::new_v4()),
            message_id: Set(inserted.id),
            file_name: Set(attachment.file_name.clone()),
            content_type: Set(attachment.content_type.clone()),
            size_bytes: Set(attachment.data.len() as i64),
            is_inline: Set(attachment.is_inline),
            content_id: Set(attachment.content_id.clone()),
            data: Set(attachment.data.clone()),
            created_at: Set(now),
        };
        model
            .insert(db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    let mut active: conversation::ActiveModel = conversation.clone().into();
    active.latest_message_at = Set(now);
    active.message_count = Set(conversation.message_count + 1);
    active.unread_count = Set(conversation.unread_count);
    active.snippet = Set(snippet);
    active.is_read = Set(true);
    active.has_attachments = Set(conversation.has_attachments || has_new_attachments);
    active.updated_at = Set(now);
    active
        .update(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
}

async fn update_conversation_flags(
    db: &DatabaseConnection,
    user: user::Model,
    id: Uuid,
    mark_read: bool,
    archive: bool,
) -> Result<StatusCode, StatusCode> {
    let conversation = conversation::Entity::find_by_id(id)
        .one(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if conversation.user_id != user.id {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut active: conversation::ActiveModel = conversation.into();
    if mark_read {
        active.unread_count = Set(0);
        active.is_read = Set(true);
    } else {
        active.unread_count = Set(1);
        active.is_read = Set(false);
    }
    active.is_archived = Set(archive);
    active
        .update(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if mark_read {
        message::Entity::update_many()
            .col_expr(
                message::Column::IsRead,
                sea_orm::sea_query::Expr::value(true),
            )
            .filter(message::Column::ConversationId.eq(id))
            .exec(db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    Ok(StatusCode::OK)
}

fn truncate(body: &str) -> String {
    let text = body.trim();
    if text.len() <= 200 {
        text.to_string()
    } else {
        text.chars().take(200).collect()
    }
}

fn addresses_to_json(addresses: &[String]) -> Value {
    Value::Array(
        addresses
            .iter()
            .map(|addr| json!({ "email": addr }))
            .collect(),
    )
}

const DEFAULT_PROVIDER_DOMAIN: &str = "stackmail.com";

async fn ensure_stackmail_provider(db: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
    let existing = email_provider_setting::Entity::find()
        .filter(email_provider_setting::Column::Domain.eq(DEFAULT_PROVIDER_DOMAIN))
        .one(db)
        .await?;

    if existing.is_some() {
        return Ok(());
    }

    info!("seeding default Stackmail provider settings");
    let now = utc_now();
    email_provider_setting::ActiveModel {
        id: Set(Uuid::new_v4()),
        domain: Set(DEFAULT_PROVIDER_DOMAIN.to_string()),
        imap_host: Set("imap.stackmail.com".to_string()),
        imap_port: Set(993),
        imap_security: Set("ssl".to_string()),
        smtp_host: Set("smtp.stackmail.com".to_string()),
        smtp_port: Set(465),
        smtp_security: Set("ssl".to_string()),
        provider: Set("stackmail".to_string()),
        require_app_password: Set(false),
        created_at: Set(now),
        updated_at: Set(now),
    }
    .insert(db)
    .await
    .map(|_| info!("created default Stackmail provider settings"))?;

    Ok(())
}

impl From<email_provider_setting::Model> for AdminEmailConfigResponse {
    fn from(model: email_provider_setting::Model) -> Self {
        Self {
            id: model.id,
            domain: model.domain,
            imap_host: model.imap_host,
            imap_port: model.imap_port,
            imap_security: model.imap_security,
            smtp_host: model.smtp_host,
            smtp_port: model.smtp_port,
            smtp_security: model.smtp_security,
            provider: model.provider,
            require_app_password: model.require_app_password,
        }
    }
}

impl From<email_attachment::Model> for AttachmentResponse {
    fn from(model: email_attachment::Model) -> Self {
        Self {
            id: model.id,
            file_name: model.file_name,
            content_type: model.content_type,
            size_bytes: model.size_bytes,
            is_inline: model.is_inline,
            content_id: model.content_id,
        }
    }
}
