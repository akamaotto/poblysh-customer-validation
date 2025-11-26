mod auth;
mod email_service;
mod entities;
mod user_management;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use chrono::Utc;
use entities::{
    contact, interview, interview_insight, outreach_log, startup, user, weekly_synthesis,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Database, DatabaseConnection, EntityTrait, QueryFilter,
    QueryOrder, Set,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

use uuid::Uuid;

use crate::auth::middleware::{AdminUser, AuthUser};
use crate::email_service::{EmailService, EmailServiceError, EmailTemplateKind};

#[derive(Clone)]
struct AppState {
    db: DatabaseConnection,
    email_service: EmailService,
}

impl axum::extract::FromRef<AppState> for DatabaseConnection {
    fn from_ref(state: &AppState) -> Self {
        state.db.clone()
    }
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

// Startup DTOs
#[derive(Deserialize)]
struct CreateStartupRequest {
    name: String,
    category: Option<String>,
    website: Option<String>,
    newsroom_url: Option<String>,
    status: String,
}

// Contact DTOs
#[derive(Deserialize)]
struct CreateContactRequest {
    startup_id: Uuid,
    name: String,
    role: String,
    email: Option<String>,
    phone: Option<String>,
    linkedin_url: Option<String>,
    is_primary: Option<bool>,
    notes: Option<String>,
}

#[derive(Deserialize)]
struct UpdateContactRequest {
    name: Option<String>,
    role: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    linkedin_url: Option<String>,
    is_primary: Option<bool>,
    notes: Option<String>,
}

#[derive(Deserialize, Default)]
struct ContactListQuery {
    trashed: Option<bool>,
}

#[derive(Serialize)]
struct ContactResponse {
    id: Uuid,
    startup_id: Uuid,
    name: String,
    role: String,
    email: Option<String>,
    phone: Option<String>,
    linkedin_url: Option<String>,
    is_primary: bool,
    notes: Option<String>,
    is_trashed: bool,
    owner_id: Option<Uuid>,
    owner_name: Option<String>,
    owner_email: Option<String>,
}

#[derive(Deserialize)]
struct BulkContactActionRequest {
    contact_ids: Vec<Uuid>,
}

impl From<(contact::Model, Option<user::Model>)> for ContactResponse {
    fn from((contact, owner): (contact::Model, Option<user::Model>)) -> Self {
        let (owner_name, owner_email) = owner
            .map(|o| (o.name.clone(), Some(o.email)))
            .unwrap_or((None, None));

        ContactResponse {
            id: contact.id,
            startup_id: contact.startup_id,
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            linkedin_url: contact.linkedin_url,
            is_primary: contact.is_primary,
            notes: contact.notes,
            is_trashed: contact.is_trashed,
            owner_id: contact.owner_id,
            owner_name,
            owner_email,
        }
    }
}

// OutreachLog DTOs
#[derive(Deserialize)]
struct CreateOutreachLogRequest {
    startup_id: Uuid,
    contact_id: Option<Uuid>,
    channel: String,
    direction: String,
    message_summary: Option<String>,
    message_id: Option<String>,
    subject: Option<String>,
    delivery_status: Option<String>,
    outcome: String,
}

#[derive(Deserialize)]
struct SendContactEmailRequest {
    subject: Option<String>,
    body_html: Option<String>,
    body_text: Option<String>,
    #[serde(default)]
    template: EmailTemplateKind,
}

#[derive(Serialize)]
struct SendContactEmailResponse {
    message_id: String,
    delivery_status: String,
    outreach_log: outreach_log::Model,
}

#[derive(Serialize)]
struct EmailStatusResponse {
    message_id: String,
    delivery_status: String,
    subject: Option<String>,
}

// Interview DTOs
#[derive(Deserialize)]
struct CreateInterviewRequest {
    startup_id: Uuid,
    contact_id: Option<Uuid>,
    date: String,
    interview_type: String,
    recording_url: Option<String>,
    transcript_url: Option<String>,
    summary: Option<String>,
}

// InterviewInsight DTOs
#[derive(Deserialize)]
struct CreateInterviewInsightRequest {
    interview_id: Uuid,
    current_workflow: Option<String>,
    biggest_pains: Vec<String>,
    desired_outcomes: Vec<String>,
    jtbd_functional: Option<String>,
    jtbd_social: Option<String>,
    jtbd_emotional: Option<String>,
    excited_features: Vec<String>,
    ignored_features: Vec<String>,
    main_objections: Vec<String>,
    interest_level: String,
    real_owner_role: Option<String>,
    willing_to_use_monthly: Option<String>,
    activation_candidate: bool,
}

// WeeklySynthesis DTOs
#[derive(Deserialize)]
struct CreateWeeklySynthesisRequest {
    week_start: String,
    week_end: String,
    total_interviews: i32,
    activation_candidates: i32,
    top_pains: Vec<String>,
    top_features: Vec<String>,
    key_insights: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "Customer Validation API is running".to_string(),
    })
}

// Startup handlers
async fn list_startups(
    State(state): State<AppState>,
    _auth_user: AuthUser,
) -> Result<Json<Vec<startup::Model>>, StatusCode> {
    let startups = startup::Entity::find()
        .order_by_desc(startup::Column::CreatedAt)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(startups))
}

async fn get_startup(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<startup::Model>, StatusCode> {
    let startup = startup::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(startup))
}

async fn create_startup(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Json(payload): Json<CreateStartupRequest>,
) -> Result<Json<startup::Model>, StatusCode> {
    let now = Utc::now().naive_utc();

    let startup = startup::ActiveModel {
        id: Set(Uuid::new_v4()),
        name: Set(payload.name),
        category: Set(payload.category),
        website: Set(payload.website),
        newsroom_url: Set(payload.newsroom_url),
        status: Set(payload.status),
        last_contact_date: Set(None),
        next_step: Set(None),
        admin_claimed: Set(false),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let result = startup
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

async fn update_startup(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateStartupRequest>,
) -> Result<Json<startup::Model>, StatusCode> {
    let existing = startup::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let mut active: startup::ActiveModel = existing.into();
    active.name = Set(payload.name);
    active.category = Set(payload.category);
    active.website = Set(payload.website);
    active.newsroom_url = Set(payload.newsroom_url);
    active.status = Set(payload.status);
    active.updated_at = Set(Utc::now().naive_utc());

    let result = active
        .update(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

async fn delete_startup(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let existing = startup::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let active: startup::ActiveModel = existing.into();
    active
        .delete(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

// Contact handlers
async fn list_contacts(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    query: Option<Query<ContactListQuery>>,
) -> Result<Json<Vec<ContactResponse>>, StatusCode> {
    let params = query.map(|q| q.0).unwrap_or_default();
    let trashed = params.trashed.unwrap_or(false);
    if trashed && !user.is_admin() {
        return Err(StatusCode::FORBIDDEN);
    }

    let contacts = fetch_contacts(&state.db, None, trashed).await?;
    Ok(Json(contacts))
}

async fn list_contacts_for_startup(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(startup_id): Path<Uuid>,
    query: Option<Query<ContactListQuery>>,
) -> Result<Json<Vec<ContactResponse>>, StatusCode> {
    let params = query.map(|q| q.0).unwrap_or_default();
    let trashed = params.trashed.unwrap_or(false);
    if trashed && !user.is_admin() {
        return Err(StatusCode::FORBIDDEN);
    }

    let contacts = fetch_contacts(&state.db, Some(startup_id), trashed).await?;
    Ok(Json(contacts))
}

async fn create_contact(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(payload): Json<CreateContactRequest>,
) -> Result<Json<ContactResponse>, StatusCode> {
    let contact = contact::ActiveModel {
        id: Set(Uuid::new_v4()),
        startup_id: Set(payload.startup_id),
        name: Set(payload.name),
        role: Set(payload.role),
        email: Set(payload.email),
        phone: Set(payload.phone),
        linkedin_url: Set(payload.linkedin_url),
        is_primary: Set(payload.is_primary.unwrap_or(false)),
        notes: Set(payload.notes),
        is_trashed: Set(false),
        owner_id: Set(Some(user.id)),
    };

    let inserted = contact
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = load_contact_with_owner(&state.db, inserted.id).await?;
    Ok(Json(response))
}

async fn update_contact(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateContactRequest>,
) -> Result<Json<ContactResponse>, StatusCode> {
    let existing = contact::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !can_edit_contact(&user, &existing) {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut active: contact::ActiveModel = existing.into();
    if let Some(name) = payload.name {
        active.name = Set(name);
    }
    if let Some(role) = payload.role {
        active.role = Set(role);
    }
    if let Some(email) = payload.email {
        active.email = Set(Some(email));
    }
    if let Some(phone) = payload.phone {
        active.phone = Set(Some(phone));
    }
    if let Some(linkedin_url) = payload.linkedin_url {
        active.linkedin_url = Set(Some(linkedin_url));
    }
    if let Some(is_primary) = payload.is_primary {
        active.is_primary = Set(is_primary);
    }
    if let Some(notes) = payload.notes {
        active.notes = Set(Some(notes));
    }

    let updated = active
        .update(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = load_contact_with_owner(&state.db, updated.id).await?;
    Ok(Json(response))
}

async fn trash_contact(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ContactResponse>, StatusCode> {
    let existing = contact::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !can_trash_contact(&user, &existing) {
        return Err(StatusCode::FORBIDDEN);
    }

    let response = set_contact_trash_state(&state.db, existing, true).await?;
    Ok(Json(response))
}

async fn restore_contact(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(id): Path<Uuid>,
) -> Result<Json<ContactResponse>, StatusCode> {
    let existing = contact::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let response = set_contact_trash_state(&state.db, existing, false).await?;
    Ok(Json(response))
}

async fn permanently_delete_contact(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let existing = contact::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !existing.is_trashed {
        return Err(StatusCode::BAD_REQUEST);
    }

    let active: contact::ActiveModel = existing.into();
    active
        .delete(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn bulk_restore_contacts(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Json(payload): Json<BulkContactActionRequest>,
) -> Result<Json<Vec<ContactResponse>>, StatusCode> {
    if payload.contact_ids.is_empty() {
        return Ok(Json(vec![]));
    }

    let mut restored = Vec::new();
    for contact_id in payload.contact_ids {
        if let Some(existing) = contact::Entity::find_by_id(contact_id)
            .one(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        {
            if existing.is_trashed {
                let response = set_contact_trash_state(&state.db, existing, false).await?;
                restored.push(response);
            }
        }
    }

    Ok(Json(restored))
}

async fn bulk_delete_contacts(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Json(payload): Json<BulkContactActionRequest>,
) -> Result<StatusCode, StatusCode> {
    for contact_id in payload.contact_ids {
        if let Some(existing) = contact::Entity::find_by_id(contact_id)
            .one(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        {
            if existing.is_trashed {
                let active: contact::ActiveModel = existing.into();
                active
                    .delete(&state.db)
                    .await
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            }
        }
    }

    Ok(StatusCode::NO_CONTENT)
}

fn user_owns_contact(user: &user::Model, contact: &contact::Model) -> bool {
    contact.owner_id.map(|id| id == user.id).unwrap_or(false)
}

fn can_edit_contact(user: &user::Model, contact: &contact::Model) -> bool {
    user.is_admin() || user_owns_contact(user, contact)
}

fn can_trash_contact(user: &user::Model, contact: &contact::Model) -> bool {
    user.is_admin() || user_owns_contact(user, contact)
}

async fn fetch_contacts(
    db: &DatabaseConnection,
    startup_id: Option<Uuid>,
    trashed: bool,
) -> Result<Vec<ContactResponse>, StatusCode> {
    let mut query = contact::Entity::find().order_by_asc(contact::Column::Name);

    if let Some(id) = startup_id {
        query = query.filter(contact::Column::StartupId.eq(id));
    }

    if trashed {
        query = query.filter(contact::Column::IsTrashed.eq(true));
    } else {
        query = query.filter(contact::Column::IsTrashed.eq(false));
    }

    let contacts = query
        .find_also_related(user::Entity)
        .all(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(contacts.into_iter().map(ContactResponse::from).collect())
}

async fn load_contact_with_owner(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<ContactResponse, StatusCode> {
    let contact = contact::Entity::find_by_id(id)
        .find_also_related(user::Entity)
        .one(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(ContactResponse::from(contact))
}

async fn set_contact_trash_state(
    db: &DatabaseConnection,
    contact_model: contact::Model,
    trashed: bool,
) -> Result<ContactResponse, StatusCode> {
    if contact_model.is_trashed == trashed {
        return load_contact_with_owner(db, contact_model.id).await;
    }

    let mut active: contact::ActiveModel = contact_model.into();
    active.is_trashed = Set(trashed);

    let updated = active
        .update(db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    load_contact_with_owner(db, updated.id).await
}

// OutreachLog handlers
async fn list_outreach_for_startup(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(startup_id): Path<Uuid>,
) -> Result<Json<Vec<outreach_log::Model>>, StatusCode> {
    let logs = outreach_log::Entity::find()
        .filter(outreach_log::Column::StartupId.eq(startup_id))
        .order_by_desc(outreach_log::Column::Date)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(logs))
}

async fn create_outreach_log(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Json(payload): Json<CreateOutreachLogRequest>,
) -> Result<Json<outreach_log::Model>, StatusCode> {
    let log = outreach_log::ActiveModel {
        id: Set(Uuid::new_v4()),
        startup_id: Set(payload.startup_id),
        contact_id: Set(payload.contact_id),
        channel: Set(payload.channel),
        direction: Set(payload.direction),
        message_summary: Set(payload.message_summary),
        message_id: Set(payload.message_id),
        subject: Set(payload.subject),
        delivery_status: Set(payload.delivery_status),
        date: Set(Utc::now().naive_utc()),
        outcome: Set(payload.outcome),
    };

    let result = log
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

async fn send_contact_email_handler(
    State(state): State<AppState>,
    AuthUser(sender): AuthUser,
    Path((startup_id, contact_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<SendContactEmailRequest>,
) -> Result<Json<SendContactEmailResponse>, StatusCode> {
    let contact = contact::Entity::find()
        .filter(contact::Column::Id.eq(contact_id))
        .filter(contact::Column::StartupId.eq(startup_id))
        .filter(contact::Column::IsTrashed.eq(false))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let startup = startup::Entity::find_by_id(startup_id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let template_kind = payload.template;
    let defaults = template_kind.defaults(&contact.name, &startup.name);

    let subject = payload.subject.unwrap_or_else(|| defaults.subject.clone());
    let html_body = payload
        .body_html
        .unwrap_or_else(|| defaults.html_body.clone());
    let mut text_body = payload
        .body_text
        .unwrap_or_else(|| defaults.text_body.clone());

    if subject.trim().is_empty() || html_body.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    if text_body.trim().is_empty() {
        text_body = fallback_plain_text(&html_body);
    }

    let sender_email = sender.email.clone();
    let sender_name = sender.name.clone().unwrap_or_else(|| sender_email.clone());

    let send_result = state
        .email_service
        .send_contact_email(
            contact.email.as_ref(),
            &sender_name,
            &sender_email,
            &subject,
            &html_body,
            &text_body,
        )
        .await
        .map_err(|err| {
            tracing::error!("failed to send email: {}", err);
            match err {
                EmailServiceError::MissingRecipient => StatusCode::BAD_REQUEST,
                EmailServiceError::Transport(_) => StatusCode::BAD_GATEWAY,
            }
        })?;

    let summary = truncate_preview(&text_body);

    let log = outreach_log::ActiveModel {
        id: Set(Uuid::new_v4()),
        startup_id: Set(startup_id),
        contact_id: Set(Some(contact_id)),
        channel: Set("email".to_string()),
        direction: Set("outbound".to_string()),
        message_summary: Set(Some(summary)),
        message_id: Set(Some(send_result.message_id.clone())),
        subject: Set(Some(subject.clone())),
        delivery_status: Set(Some(send_result.delivery_status.clone())),
        date: Set(Utc::now().naive_utc()),
        outcome: Set(format!("{} email sent", template_kind.display_name())),
    };

    let record = log
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(SendContactEmailResponse {
        message_id: send_result.message_id,
        delivery_status: send_result.delivery_status,
        outreach_log: record,
    }))
}

async fn get_email_status_handler(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(message_id): Path<String>,
) -> Result<Json<EmailStatusResponse>, StatusCode> {
    let log = outreach_log::Entity::find()
        .filter(outreach_log::Column::MessageId.eq(message_id.clone()))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let status = state
        .email_service
        .fetch_status(&message_id)
        .await
        .map_err(|err| {
            tracing::error!("failed to fetch email status: {}", err);
            StatusCode::BAD_GATEWAY
        })?;

    let mut active: outreach_log::ActiveModel = log.into();
    active.delivery_status = Set(Some(status.status.clone()));
    let updated = active
        .update(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(EmailStatusResponse {
        message_id: updated.message_id.clone().unwrap_or(message_id),
        delivery_status: status.status,
        subject: updated.subject,
    }))
}

// Interview handlers
async fn list_interviews_for_startup(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(startup_id): Path<Uuid>,
) -> Result<Json<Vec<interview::Model>>, StatusCode> {
    let interviews = interview::Entity::find()
        .filter(interview::Column::StartupId.eq(startup_id))
        .order_by_desc(interview::Column::Date)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(interviews))
}

async fn list_all_interviews(
    State(state): State<AppState>,
    _auth_user: AuthUser,
) -> Result<Json<Vec<interview::Model>>, StatusCode> {
    let interviews = interview::Entity::find()
        .order_by_desc(interview::Column::Date)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(interviews))
}

async fn create_interview(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Json(payload): Json<CreateInterviewRequest>,
) -> Result<Json<interview::Model>, StatusCode> {
    let date = chrono::NaiveDateTime::parse_from_str(&payload.date, "%Y-%m-%dT%H:%M:%S")
        .or_else(|_| {
            chrono::NaiveDate::parse_from_str(&payload.date, "%Y-%m-%d")
                .map(|d| d.and_hms_opt(0, 0, 0).unwrap())
        })
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let interview = interview::ActiveModel {
        id: Set(Uuid::new_v4()),
        startup_id: Set(payload.startup_id),
        contact_id: Set(payload.contact_id),
        date: Set(date),
        interview_type: Set(payload.interview_type),
        recording_url: Set(payload.recording_url),
        transcript_url: Set(payload.transcript_url),
        summary: Set(payload.summary),
    };

    let result = interview
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

// InterviewInsight handlers
async fn get_insight_for_interview(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Path(interview_id): Path<Uuid>,
) -> Result<Json<interview_insight::Model>, StatusCode> {
    let insight = interview_insight::Entity::find()
        .filter(interview_insight::Column::InterviewId.eq(interview_id))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(insight))
}

async fn create_interview_insight(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Json(payload): Json<CreateInterviewInsightRequest>,
) -> Result<Json<interview_insight::Model>, StatusCode> {
    let insight = interview_insight::ActiveModel {
        id: Set(Uuid::new_v4()),
        interview_id: Set(payload.interview_id),
        current_workflow: Set(payload.current_workflow),
        biggest_pains: Set(Some(serde_json::to_value(&payload.biggest_pains).unwrap())),
        desired_outcomes: Set(Some(
            serde_json::to_value(&payload.desired_outcomes).unwrap(),
        )),
        jtbd_functional: Set(payload.jtbd_functional),
        jtbd_social: Set(payload.jtbd_social),
        jtbd_emotional: Set(payload.jtbd_emotional),
        excited_features: Set(Some(
            serde_json::to_value(&payload.excited_features).unwrap(),
        )),
        ignored_features: Set(Some(
            serde_json::to_value(&payload.ignored_features).unwrap(),
        )),
        main_objections: Set(Some(
            serde_json::to_value(&payload.main_objections).unwrap(),
        )),
        interest_level: Set(payload.interest_level),
        real_owner_role: Set(payload.real_owner_role),
        willing_to_use_monthly: Set(payload.willing_to_use_monthly),
        activation_candidate: Set(payload.activation_candidate),
    };

    let result = insight
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

// WeeklySynthesis handlers
async fn list_weekly_syntheses(
    State(state): State<AppState>,
    _auth_user: AuthUser,
) -> Result<Json<Vec<weekly_synthesis::Model>>, StatusCode> {
    let syntheses = weekly_synthesis::Entity::find()
        .order_by_desc(weekly_synthesis::Column::WeekStartDate)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(syntheses))
}

async fn create_weekly_synthesis(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    Json(payload): Json<CreateWeeklySynthesisRequest>,
) -> Result<Json<weekly_synthesis::Model>, StatusCode> {
    let week_start = chrono::NaiveDate::parse_from_str(&payload.week_start, "%Y-%m-%d")
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let week_end = chrono::NaiveDate::parse_from_str(&payload.week_end, "%Y-%m-%d")
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let synthesis = weekly_synthesis::ActiveModel {
        id: Set(Uuid::new_v4()),
        week_start_date: Set(week_start),
        week_end_date: Set(week_end),
        top_pains: Set(Some(serde_json::to_string(&payload.top_pains).unwrap())),
        top_desired_outcomes: Set(Some(serde_json::to_string(&payload.top_features).unwrap())),
        top_features: Set(Some(serde_json::to_string(&payload.top_features).unwrap())),
        top_objections: Set(Some(String::new())),
        owner_persona_summary: Set(Some(payload.key_insights.clone())),
        activation_summary: Set(Some(format!(
            "{} activation candidates from {} interviews",
            payload.activation_candidates, payload.total_interviews
        ))),
        product_implications: Set(Some(payload.key_insights)),
    };

    let result = synthesis
        .insert(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

fn truncate_preview(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.len() <= 240 {
        return trimmed.to_string();
    }

    let mut shortened = String::new();
    for ch in trimmed.chars().take(240) {
        shortened.push(ch);
    }
    shortened.push_str("...");
    shortened
}

fn fallback_plain_text(input: &str) -> String {
    let mut output = String::new();
    let mut in_tag = false;
    for ch in input.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => {
                in_tag = false;
                if !output.ends_with(' ') {
                    output.push(' ');
                }
            }
            _ if !in_tag => output.push(ch),
            _ => {}
        }
    }

    output.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[tokio::main]
async fn main() {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Connect to database
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let db = Database::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let email_service = EmailService::from_env();

    let state = AppState { db, email_service };

    // Build CORS layer
    // Note: Cannot use Any wildcards with allow_credentials(true)
    // Must specify explicit origin, methods, and headers
    let cors = CorsLayer::new()
        .allow_origin(
            "http://localhost:3000"
                .parse::<axum::http::HeaderValue>()
                .unwrap(),
        )
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT,
        ])
        .allow_credentials(true);

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        // Auth routes (public)
        .route("/api/auth/login", post(auth::handlers::login))
        .route(
            "/api/auth/forgot-password",
            post(auth::handlers::forgot_password),
        )
        .route(
            "/api/auth/reset-password",
            post(auth::handlers::reset_password),
        )
        // Auth routes (protected)
        .route("/api/auth/logout", post(auth::handlers::logout))
        .route("/api/auth/me", get(auth::handlers::get_current_user))
        // User management routes (protected)
        .route(
            "/api/users",
            get(user_management::list_users).post(user_management::create_user),
        )
        .route(
            "/api/users/:id",
            get(user_management::get_user)
                .put(user_management::update_user)
                .delete(user_management::delete_user),
        )
        .route(
            "/api/users/:id/password",
            put(user_management::change_password),
        )
        // Startup routes
        .route("/api/startups", get(list_startups).post(create_startup))
        .route(
            "/api/startups/:id",
            get(get_startup).put(update_startup).delete(delete_startup),
        )
        // Contact routes
        .route("/api/contacts", get(list_contacts))
        .route(
            "/api/startups/:startup_id/contacts",
            get(list_contacts_for_startup).post(create_contact),
        )
        .route(
            "/api/contacts/:id",
            put(update_contact).delete(trash_contact),
        )
        .route("/api/admin/contacts/:id/restore", post(restore_contact))
        .route(
            "/api/admin/contacts/:id/permanent",
            delete(permanently_delete_contact),
        )
        .route("/api/admin/contacts/restore", post(bulk_restore_contacts))
        .route(
            "/api/admin/contacts/delete-forever",
            post(bulk_delete_contacts),
        )
        .route(
            "/api/startups/:startup_id/contacts/:contact_id/send-email",
            post(send_contact_email_handler),
        )
        // OutreachLog routes
        .route(
            "/api/startups/:startup_id/outreach",
            get(list_outreach_for_startup).post(create_outreach_log),
        )
        .route(
            "/api/email-status/:message_id",
            get(get_email_status_handler),
        )
        // Interview routes
        .route(
            "/api/startups/:startup_id/interviews",
            get(list_interviews_for_startup).post(create_interview),
        )
        .route("/api/interviews", get(list_all_interviews))
        // InterviewInsight routes
        .route(
            "/api/interviews/:interview_id/insight",
            get(get_insight_for_interview).post(create_interview_insight),
        )
        // WeeklySynthesis routes
        .route(
            "/api/weekly-synthesis",
            get(list_weekly_syntheses).post(create_weekly_synthesis),
        )
        .layer(cors)
        .with_state(state);

    // Run server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
