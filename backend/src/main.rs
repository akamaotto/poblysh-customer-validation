mod auth;
mod conversations_controller;
mod email_service;
mod entities;
mod services;
mod user_management;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use chrono::{Datelike, NaiveDate, Utc};
use entities::{
    activity_event, contact, interview, interview_insight, outreach_log, startup, user,
    weekly_activity_plan, weekly_metric_definition, weekly_synthesis,
};
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::sea_query::Expr;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, Database, DatabaseConnection, EntityTrait,
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::SocketAddr;
use tokio::time::{interval, Duration as TokioDuration};
use tower_http::cors::CorsLayer;

use uuid::Uuid;

use crate::auth::middleware::{AdminUser, AuthUser};
use crate::email_service::{EmailService, EmailServiceError, EmailTemplateKind};
use crate::services::encryption_service::EncryptionService;
use crate::services::imap_service::ImapService;

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

const PLAN_STATUS_DRAFT: &str = "draft";
const PLAN_STATUS_ACTIVE: &str = "active";
const PLAN_STATUS_CLOSED: &str = "closed";
const METRIC_TYPE_INPUT: &str = "input";
const METRIC_TYPE_OUTPUT: &str = "output";
const ACTIVITY_CONTACT_CREATED: &str = "contact_created";
const ACTIVITY_STARTUP_CREATED: &str = "startup_created";
const ACTIVITY_OUTREACH_LOGGED: &str = "outreach_logged";
const ACTIVITY_MEETING_LOGGED: &str = "meeting_logged";
const ACTIVITY_STAGE_MOVED: &str = "stage_moved";
const INPUT_ACTIVITY_TYPES: &[&str] = &[
    ACTIVITY_CONTACT_CREATED,
    ACTIVITY_STARTUP_CREATED,
    ACTIVITY_OUTREACH_LOGGED,
    ACTIVITY_MEETING_LOGGED,
];

#[derive(Deserialize)]
struct WeeklyPlanUpsertRequest {
    week_start: String,
    metrics: Vec<WeeklyMetricInput>,
}

#[derive(Deserialize)]
struct WeeklyMetricInput {
    metric_type: String,
    name: String,
    unit_label: String,
    owner_name: Option<String>,
    owner_id: Option<Uuid>,
    target_value: i32,
    activity_type: Option<String>,
    stage_name: Option<String>,
    sort_order: Option<i32>,
}

#[derive(Deserialize, Default)]
struct WeekQuery {
    week_start: Option<String>,
}

#[derive(Deserialize, Default)]
struct ActivityFeedQuery {
    page: Option<u32>,
    page_size: Option<u32>,
    search: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    startup_id: Option<Uuid>,
    contact_id: Option<Uuid>,
    user_id: Option<Uuid>,
    stage: Option<String>,
    activity_type: Option<String>,
}

#[derive(Serialize)]
struct WeeklyPlanResponse {
    id: Option<Uuid>,
    week_start: String,
    week_end: String,
    status: String,
    metrics: Vec<WeeklyMetricResponse>,
}

#[derive(Serialize)]
struct WeeklyMetricResponse {
    id: Option<Uuid>,
    metric_type: String,
    name: String,
    unit_label: String,
    owner_name: Option<String>,
    owner_id: Option<Uuid>,
    target_value: i32,
    actual_value: i32,
    activity_type: Option<String>,
    stage_name: Option<String>,
}

#[derive(Serialize)]
struct WeeklyActivitySummaryResponse {
    current_plan: Option<WeeklyPlanResponse>,
    activity_preview: Vec<ActivityEventResponse>,
}

#[derive(Serialize)]
struct ActivityFeedResponse {
    total: u64,
    page: u32,
    page_size: u32,
    results: Vec<ActivityEventResponse>,
}

#[derive(Serialize)]
struct ActivityEventResponse {
    id: Uuid,
    activity_type: String,
    description: String,
    occurred_at: String,
    user_name: Option<String>,
    startup_id: Option<Uuid>,
    startup_name: Option<String>,
    contact_id: Option<Uuid>,
    contact_name: Option<String>,
    stage_from: Option<String>,
    stage_to: Option<String>,
}

struct ActivityEventInput {
    activity_type: &'static str,
    description: String,
    user_id: Option<Uuid>,
    user_name: Option<String>,
    startup_id: Option<Uuid>,
    startup_name: Option<String>,
    contact_id: Option<Uuid>,
    contact_name: Option<String>,
    stage_from: Option<String>,
    stage_to: Option<String>,
    metadata: Option<serde_json::Value>,
    occurred_at: Option<chrono::NaiveDateTime>,
}

impl From<activity_event::Model> for ActivityEventResponse {
    fn from(model: activity_event::Model) -> Self {
        ActivityEventResponse {
            id: model.id,
            activity_type: model.activity_type,
            description: model.description,
            occurred_at: model.occurred_at.and_utc().to_rfc3339(),
            user_name: model.user_name,
            startup_id: model.startup_id,
            startup_name: model.startup_name,
            contact_id: model.contact_id,
            contact_name: model.contact_name,
            stage_from: model.stage_from,
            stage_to: model.stage_to,
        }
    }
}

impl From<weekly_metric_definition::Model> for WeeklyMetricResponse {
    fn from(model: weekly_metric_definition::Model) -> Self {
        WeeklyMetricResponse {
            id: Some(model.id),
            metric_type: model.metric_type,
            name: model.name,
            unit_label: model.unit_label,
            owner_name: model.owner_name,
            owner_id: model.owner_id,
            target_value: model.target_value,
            actual_value: model.actual_value,
            activity_type: model.activity_type,
            stage_name: model.stage_name,
        }
    }
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
    AuthUser(user): AuthUser,
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

    let startup_name = result.name.clone();
    let startup_status = result.status.clone();

    if let Err(err) = record_activity_event(
        &state.db,
        ActivityEventInput {
            activity_type: ACTIVITY_STARTUP_CREATED,
            description: format!("Added startup {}", startup_name),
            user_id: Some(user.id),
            user_name: Some(user_display_name(&user)),
            startup_id: Some(result.id),
            startup_name: Some(startup_name),
            contact_id: None,
            contact_name: None,
            stage_from: None,
            stage_to: Some(startup_status.clone()),
            metadata: Some(json!({ "status": startup_status })),
            occurred_at: None,
        },
    )
    .await
    {
        tracing::warn!(error = ?err, "failed to record startup creation activity");
    }

    Ok(Json(result))
}

async fn update_startup(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateStartupRequest>,
) -> Result<Json<startup::Model>, StatusCode> {
    let existing = startup::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let previous_status = existing.status.clone();
    let mut active: startup::ActiveModel = existing.into();
    active.name = Set(payload.name);
    active.category = Set(payload.category);
    active.website = Set(payload.website);
    active.newsroom_url = Set(payload.newsroom_url);
    active.status = Set(payload.status.clone());
    active.updated_at = Set(Utc::now().naive_utc());

    let result = active
        .update(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if previous_status != result.status {
        if let Err(err) = record_activity_event(
            &state.db,
            ActivityEventInput {
                activity_type: ACTIVITY_STAGE_MOVED,
                description: format!(
                    "Moved {} from {} to {}",
                    result.name, previous_status, result.status
                ),
                user_id: Some(user.id),
                user_name: Some(user_display_name(&user)),
                startup_id: Some(result.id),
                startup_name: Some(result.name.clone()),
                contact_id: None,
                contact_name: None,
                stage_from: Some(previous_status),
                stage_to: Some(result.status.clone()),
                metadata: None,
                occurred_at: None,
            },
        )
        .await
        {
            tracing::warn!(error = ?err, "failed to record stage move activity");
        }
    }

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

    let startup_name = lookup_startup_name(&state.db, inserted.startup_id).await;

    if let Err(err) = record_activity_event(
        &state.db,
        ActivityEventInput {
            activity_type: ACTIVITY_CONTACT_CREATED,
            description: format!("Added contact {} ({})", inserted.name, inserted.role),
            user_id: Some(user.id),
            user_name: Some(user_display_name(&user)),
            startup_id: Some(inserted.startup_id),
            startup_name: startup_name.clone(),
            contact_id: Some(inserted.id),
            contact_name: Some(inserted.name.clone()),
            stage_from: None,
            stage_to: None,
            metadata: Some(json!({ "contact_role": inserted.role })),
            occurred_at: None,
        },
    )
    .await
    {
        tracing::warn!(error = ?err, "failed to record contact creation activity");
    }

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
    AuthUser(user): AuthUser,
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

    let startup_name = lookup_startup_name(&state.db, result.startup_id).await;
    let contact_name = if let Some(contact_id) = result.contact_id {
        lookup_contact_name(&state.db, contact_id).await
    } else {
        None
    };

    if let Err(err) = record_activity_event(
        &state.db,
        ActivityEventInput {
            activity_type: ACTIVITY_OUTREACH_LOGGED,
            description: format!("Logged {} outreach ({})", result.channel, result.direction),
            user_id: Some(user.id),
            user_name: Some(user_display_name(&user)),
            startup_id: Some(result.startup_id),
            startup_name: startup_name.clone(),
            contact_id: result.contact_id,
            contact_name,
            stage_from: None,
            stage_to: None,
            metadata: Some(json!({ "outcome": result.outcome, "channel": result.channel })),
            occurred_at: Some(result.date),
        },
    )
    .await
    {
        tracing::warn!(error = ?err, "failed to record outreach activity");
    }

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
    AuthUser(user): AuthUser,
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

    let startup_name = lookup_startup_name(&state.db, result.startup_id).await;

    if let Err(err) = record_activity_event(
        &state.db,
        ActivityEventInput {
            activity_type: ACTIVITY_MEETING_LOGGED,
            description: format!(
                "Logged {} with {}",
                result.interview_type,
                startup_name
                    .clone()
                    .unwrap_or_else(|| "startup".to_string())
            ),
            user_id: Some(user.id),
            user_name: Some(user_display_name(&user)),
            startup_id: Some(result.startup_id),
            startup_name,
            contact_id: result.contact_id,
            contact_name: None,
            stage_from: None,
            stage_to: None,
            metadata: Some(json!({ "date": result.date.to_string() })),
            occurred_at: Some(result.date),
        },
    )
    .await
    {
        tracing::warn!(error = ?err, "failed to record interview activity");
    }

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

async fn get_weekly_activity_plan(
    State(state): State<AppState>,
    _admin: AdminUser,
    query: Option<Query<WeekQuery>>,
) -> Result<Json<WeeklyPlanResponse>, StatusCode> {
    let params = query.map(|q| q.0).unwrap_or_default();
    let requested_date = params
        .week_start
        .as_deref()
        .map(parse_date_str)
        .transpose()?
        .unwrap_or_else(|| Utc::now().date_naive());
    let week_start = normalize_to_week_start(requested_date);
    let week_end = compute_week_end(week_start);

    let plan = weekly_activity_plan::Entity::find()
        .filter(weekly_activity_plan::Column::WeekStart.eq(week_start))
        .filter(weekly_activity_plan::Column::WeekEnd.eq(week_end))
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = if let Some(plan) = plan {
        hydrate_plan_response(&state.db, plan)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        empty_plan_response(week_start)
    };

    Ok(Json(response))
}

async fn update_weekly_activity_plan(
    State(state): State<AppState>,
    AdminUser(admin): AdminUser,
    Json(payload): Json<WeeklyPlanUpsertRequest>,
) -> Result<Json<WeeklyPlanResponse>, StatusCode> {
    if payload.metrics.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let requested_start = parse_date_str(&payload.week_start)?;
    let week_start = normalize_to_week_start(requested_start);
    let week_end = compute_week_end(week_start);
    let status = determine_status_for_week(week_start, week_end);
    let now = Utc::now().naive_utc();

    let txn = state
        .db
        .begin()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let existing_plan = weekly_activity_plan::Entity::find()
        .filter(weekly_activity_plan::Column::WeekStart.eq(week_start))
        .filter(weekly_activity_plan::Column::WeekEnd.eq(week_end))
        .one(&txn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let plan_model = if let Some(plan) = existing_plan {
        let mut active: weekly_activity_plan::ActiveModel = plan.into();
        active.status = Set(status.clone());
        active.week_start = Set(week_start);
        active.week_end = Set(week_end);
        active.updated_at = Set(now);
        active.closed_at = Set(if status == PLAN_STATUS_CLOSED {
            Some(now)
        } else {
            None
        });
        active
            .update(&txn)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        weekly_activity_plan::ActiveModel {
            id: Set(Uuid::new_v4()),
            week_start: Set(week_start),
            week_end: Set(week_end),
            status: Set(status.clone()),
            created_by: Set(Some(admin.id)),
            created_at: Set(now),
            updated_at: Set(now),
            closed_at: Set(if status == PLAN_STATUS_CLOSED {
                Some(now)
            } else {
                None
            }),
        }
        .insert(&txn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    };

    weekly_metric_definition::Entity::delete_many()
        .filter(weekly_metric_definition::Column::PlanId.eq(plan_model.id))
        .exec(&txn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    for (idx, metric) in payload.metrics.iter().enumerate() {
        let metric_type = metric.metric_type.trim().to_lowercase();
        let name = metric.name.trim().to_string();
        let unit_label = metric.unit_label.trim().to_string();
        let target_value = metric.target_value.max(0);
        let owner_name = metric
            .owner_name
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let activity_type = metric
            .activity_type
            .as_ref()
            .map(|value| value.trim().to_lowercase())
            .filter(|value| !value.is_empty());
        let stage_name = metric
            .stage_name
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        if name.is_empty() || unit_label.is_empty() {
            return Err(StatusCode::BAD_REQUEST);
        }

        if metric_type != METRIC_TYPE_INPUT && metric_type != METRIC_TYPE_OUTPUT {
            return Err(StatusCode::BAD_REQUEST);
        }

        if metric_type == METRIC_TYPE_INPUT {
            let Some(ref event_key) = activity_type else {
                return Err(StatusCode::BAD_REQUEST);
            };
            if !INPUT_ACTIVITY_TYPES.contains(&event_key.as_str()) {
                return Err(StatusCode::BAD_REQUEST);
            }
        }

        if metric_type == METRIC_TYPE_OUTPUT && stage_name.is_none() {
            return Err(StatusCode::BAD_REQUEST);
        }

        weekly_metric_definition::ActiveModel {
            id: Set(Uuid::new_v4()),
            plan_id: Set(plan_model.id),
            metric_type: Set(metric_type),
            name: Set(name),
            unit_label: Set(unit_label),
            owner_name: Set(owner_name.clone()),
            owner_id: Set(metric.owner_id),
            target_value: Set(target_value),
            actual_value: Set(0),
            activity_type: Set(activity_type.clone()),
            stage_name: Set(stage_name.clone()),
            sort_order: Set(metric.sort_order.unwrap_or(idx as i32)),
            created_at: Set(now),
            updated_at: Set(now),
        }
        .insert(&txn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    txn.commit()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = hydrate_plan_response(&state.db, plan_model)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(response))
}

async fn close_weekly_activity_plan(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(plan_id): Path<Uuid>,
) -> Result<Json<WeeklyPlanResponse>, StatusCode> {
    let plan = weekly_activity_plan::Entity::find_by_id(plan_id)
        .one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let closed = mark_plan_closed(&state.db, plan)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let response = hydrate_plan_response(&state.db, closed)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(response))
}

async fn get_weekly_activity_summary(
    State(state): State<AppState>,
    _auth_user: AuthUser,
) -> Result<Json<WeeklyActivitySummaryResponse>, StatusCode> {
    let today = Utc::now().date_naive();
    let plan = find_plan_covering_date(&state.db, today)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let current_plan = if let Some(plan) = plan {
        Some(
            hydrate_plan_response(&state.db, plan)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
        )
    } else {
        None
    };

    let preview = activity_event::Entity::find()
        .order_by_desc(activity_event::Column::OccurredAt)
        .limit(20)
        .all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(WeeklyActivitySummaryResponse {
        current_plan,
        activity_preview: preview
            .into_iter()
            .map(ActivityEventResponse::from)
            .collect(),
    }))
}

async fn list_activity_feed(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    query: Option<Query<ActivityFeedQuery>>,
) -> Result<Json<ActivityFeedResponse>, StatusCode> {
    let ActivityFeedQuery {
        page,
        page_size,
        search,
        start_date,
        end_date,
        startup_id,
        contact_id,
        user_id,
        stage,
        activity_type,
    } = query.map(|q| q.0).unwrap_or_default();

    let mut filters = Condition::all();

    if let Some(startup_id) = startup_id {
        filters = filters.add(activity_event::Column::StartupId.eq(startup_id));
    }
    if let Some(contact_id) = contact_id {
        filters = filters.add(activity_event::Column::ContactId.eq(contact_id));
    }
    if let Some(user_id) = user_id {
        filters = filters.add(activity_event::Column::UserId.eq(user_id));
    }
    if let Some(activity_type) = activity_type {
        if !activity_type.trim().is_empty() {
            filters = filters.add(activity_event::Column::ActivityType.eq(activity_type));
        }
    }
    if let Some(stage_value) = stage {
        if !stage_value.trim().is_empty() {
            filters = filters.add(activity_event::Column::StageTo.eq(stage_value));
        }
    }

    if let Some(start) = start_date.as_deref() {
        let date = parse_date_str(start)?;
        let start_dt = date.and_hms_opt(0, 0, 0).unwrap();
        filters = filters.add(activity_event::Column::OccurredAt.gte(start_dt));
    }

    if let Some(end) = end_date.as_deref() {
        let date = parse_date_str(end)?;
        let end_dt = date.and_hms_opt(23, 59, 59).unwrap();
        filters = filters.add(activity_event::Column::OccurredAt.lte(end_dt));
    }

    if let Some(search_value) = search {
        let trimmed = search_value.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed);
            filters = filters.add(
                Condition::any()
                    .add(Expr::col(activity_event::Column::Description).ilike(pattern.clone()))
                    .add(Expr::col(activity_event::Column::StartupName).ilike(pattern.clone()))
                    .add(Expr::col(activity_event::Column::ContactName).ilike(pattern.clone()))
                    .add(Expr::col(activity_event::Column::UserName).ilike(pattern)),
            );
        }
    }

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(20).clamp(10, 100);

    let base_query = activity_event::Entity::find()
        .filter(filters)
        .order_by_desc(activity_event::Column::OccurredAt);

    let paginator = base_query.paginate(&state.db, page_size as u64);

    let total = paginator
        .num_items()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let events = paginator
        .fetch_page((page - 1) as u64)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ActivityFeedResponse {
        total,
        page,
        page_size,
        results: events
            .into_iter()
            .map(ActivityEventResponse::from)
            .collect(),
    }))
}

async fn record_activity_event(
    db: &DatabaseConnection,
    input: ActivityEventInput,
) -> Result<(), sea_orm::DbErr> {
    let occurred_at = input.occurred_at.unwrap_or_else(|| Utc::now().naive_utc());
    let stage_to = input.stage_to.clone();
    let activity_date = occurred_at.date();
    let event = activity_event::ActiveModel {
        id: Set(Uuid::new_v4()),
        activity_type: Set(input.activity_type.to_string()),
        description: Set(input.description),
        occurred_at: Set(occurred_at),
        user_id: Set(input.user_id),
        user_name: Set(input.user_name),
        startup_id: Set(input.startup_id),
        startup_name: Set(input.startup_name),
        contact_id: Set(input.contact_id),
        contact_name: Set(input.contact_name),
        stage_from: Set(input.stage_from),
        stage_to: Set(stage_to.clone()),
        metadata: Set(input.metadata),
        created_at: Set(Utc::now().naive_utc()),
    };

    event.insert(db).await?;

    if let Err(err) =
        increment_metrics_for_event(db, input.activity_type, stage_to.as_deref(), activity_date)
            .await
    {
        tracing::warn!(
            error = ?err,
            "failed to update weekly metrics after recording activity event"
        );
    }

    Ok(())
}

async fn increment_metrics_for_event(
    db: &DatabaseConnection,
    activity_type: &'static str,
    stage_to: Option<&str>,
    activity_date: NaiveDate,
) -> Result<(), sea_orm::DbErr> {
    let Some(plan) = find_plan_covering_date(db, activity_date).await? else {
        return Ok(());
    };
    let plan = ensure_plan_active_for_date(db, plan, activity_date).await?;

    let metrics = weekly_metric_definition::Entity::find()
        .filter(weekly_metric_definition::Column::PlanId.eq(plan.id))
        .all(db)
        .await?;

    for metric in metrics {
        let should_increment = if metric.metric_type == METRIC_TYPE_INPUT {
            metric
                .activity_type
                .as_deref()
                .map(|value| value == activity_type)
                .unwrap_or(false)
        } else if metric.metric_type == METRIC_TYPE_OUTPUT {
            stage_to
                .and_then(|stage| metric.stage_name.as_deref().map(|value| value == stage))
                .unwrap_or(false)
        } else {
            false
        };

        if should_increment {
            let mut active: weekly_metric_definition::ActiveModel = metric.clone().into();
            active.actual_value = Set(metric.actual_value + 1);
            active.updated_at = Set(Utc::now().naive_utc());
            active.update(db).await?;
        }
    }

    Ok(())
}

async fn find_plan_covering_date(
    db: &DatabaseConnection,
    date: NaiveDate,
) -> Result<Option<weekly_activity_plan::Model>, sea_orm::DbErr> {
    weekly_activity_plan::Entity::find()
        .filter(
            Condition::all()
                .add(weekly_activity_plan::Column::WeekStart.lte(date))
                .add(weekly_activity_plan::Column::WeekEnd.gte(date)),
        )
        .order_by_desc(weekly_activity_plan::Column::WeekStart)
        .one(db)
        .await
}

async fn ensure_plan_active_for_date(
    db: &DatabaseConnection,
    plan: weekly_activity_plan::Model,
    date: NaiveDate,
) -> Result<weekly_activity_plan::Model, sea_orm::DbErr> {
    if plan.status == PLAN_STATUS_ACTIVE || plan.status == PLAN_STATUS_CLOSED {
        return Ok(plan);
    }

    if date < plan.week_start || date > plan.week_end {
        return Ok(plan);
    }

    let mut active: weekly_activity_plan::ActiveModel = plan.into();
    active.status = Set(PLAN_STATUS_ACTIVE.to_string());
    active.updated_at = Set(Utc::now().naive_utc());
    active.closed_at = Set(None);
    active.update(db).await
}

async fn fetch_metrics_for_plan(
    db: &DatabaseConnection,
    plan_id: Uuid,
) -> Result<Vec<weekly_metric_definition::Model>, sea_orm::DbErr> {
    weekly_metric_definition::Entity::find()
        .filter(weekly_metric_definition::Column::PlanId.eq(plan_id))
        .order_by_asc(weekly_metric_definition::Column::SortOrder)
        .order_by_asc(weekly_metric_definition::Column::CreatedAt)
        .all(db)
        .await
}

async fn hydrate_plan_response(
    db: &DatabaseConnection,
    plan: weekly_activity_plan::Model,
) -> Result<WeeklyPlanResponse, sea_orm::DbErr> {
    let metrics = fetch_metrics_for_plan(db, plan.id).await?;
    Ok(WeeklyPlanResponse {
        id: Some(plan.id),
        week_start: plan.week_start.to_string(),
        week_end: plan.week_end.to_string(),
        status: plan.status,
        metrics: metrics
            .into_iter()
            .map(WeeklyMetricResponse::from)
            .collect(),
    })
}

fn empty_plan_response(week_start: NaiveDate) -> WeeklyPlanResponse {
    let week_end = compute_week_end(week_start);
    WeeklyPlanResponse {
        id: None,
        week_start: week_start.to_string(),
        week_end: week_end.to_string(),
        status: PLAN_STATUS_DRAFT.to_string(),
        metrics: Vec::new(),
    }
}

fn normalize_to_week_start(date: NaiveDate) -> NaiveDate {
    let offset = date.weekday().num_days_from_monday() as i64;
    date - chrono::Duration::days(offset)
}

fn compute_week_end(week_start: NaiveDate) -> NaiveDate {
    week_start + chrono::Duration::days(6)
}

fn determine_status_for_week(week_start: NaiveDate, week_end: NaiveDate) -> String {
    let today = Utc::now().date_naive();
    if today < week_start {
        PLAN_STATUS_DRAFT.to_string()
    } else if today > week_end {
        PLAN_STATUS_CLOSED.to_string()
    } else {
        PLAN_STATUS_ACTIVE.to_string()
    }
}

async fn lookup_startup_name(db: &DatabaseConnection, startup_id: Uuid) -> Option<String> {
    startup::Entity::find_by_id(startup_id)
        .one(db)
        .await
        .ok()
        .flatten()
        .map(|model| model.name)
}

async fn lookup_contact_name(db: &DatabaseConnection, contact_id: Uuid) -> Option<String> {
    contact::Entity::find_by_id(contact_id)
        .one(db)
        .await
        .ok()
        .flatten()
        .map(|model| model.name)
}

fn user_display_name(user: &user::Model) -> String {
    user.name.clone().unwrap_or_else(|| user.email.clone())
}

fn parse_date_str(value: &str) -> Result<NaiveDate, StatusCode> {
    NaiveDate::parse_from_str(value, "%Y-%m-%d").map_err(|_| StatusCode::BAD_REQUEST)
}

async fn mark_plan_closed(
    db: &DatabaseConnection,
    plan: weekly_activity_plan::Model,
) -> Result<weekly_activity_plan::Model, sea_orm::DbErr> {
    if plan.status == PLAN_STATUS_CLOSED {
        return Ok(plan);
    }

    let mut active: weekly_activity_plan::ActiveModel = plan.into();
    let now = Utc::now().naive_utc();
    active.status = Set(PLAN_STATUS_CLOSED.to_string());
    active.closed_at = Set(Some(now));
    active.updated_at = Set(now);
    active.update(db).await
}

async fn close_completed_weeks(db: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
    let today = Utc::now().date_naive();
    let plans = weekly_activity_plan::Entity::find()
        .filter(weekly_activity_plan::Column::Status.ne(PLAN_STATUS_CLOSED))
        .filter(weekly_activity_plan::Column::WeekEnd.lt(today))
        .all(db)
        .await?;

    for plan in plans {
        let _ = mark_plan_closed(db, plan).await?;
    }

    Ok(())
}

fn spawn_weekly_plan_scheduler(db: DatabaseConnection) {
    tokio::spawn(async move {
        if let Err(err) = close_completed_weeks(&db).await {
            tracing::warn!(
                error = ?err,
                "failed to close past weekly plans on scheduler startup"
            );
        }

        let mut ticker = interval(TokioDuration::from_secs(60 * 60));
        loop {
            ticker.tick().await;
            if let Err(err) = close_completed_weeks(&db).await {
                tracing::warn!(
                    error = ?err,
                    "failed to close past weekly plans during scheduled sweep"
                );
            }
        }
    });
}

fn spawn_email_sync_scheduler(db: DatabaseConnection) {
    tokio::spawn(async move {
        let encryption_service = EncryptionService::new();
        let imap_service = ImapService::new(db.clone(), encryption_service);
        let mut ticker = interval(TokioDuration::from_secs(60 * 5));
        loop {
            ticker.tick().await;
            if let Err(err) = imap_service.sync_all_users().await {
                tracing::warn!(error = %err, "failed to run inbox sync");
            }
        }
    });
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

    let state = AppState {
        db: db.clone(),
        email_service,
    };

    spawn_weekly_plan_scheduler(state.db.clone());
    spawn_email_sync_scheduler(state.db.clone());

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
        .route("/api/weekly-synthesis", post(create_weekly_synthesis))
        // Email & Conversations
        .route(
            "/api/admin/email-config",
            get(conversations_controller::list_admin_email_configs)
                .post(conversations_controller::save_admin_email_config),
        )
        .route(
            "/api/email/config",
            get(conversations_controller::get_email_config)
                .post(conversations_controller::save_email_config),
        )
        .route(
            "/api/email/config/test",
            post(conversations_controller::test_email_credentials),
        )
        .route(
            "/api/email/sync",
            post(conversations_controller::sync_emails),
        )
        .route(
            "/api/user/email-status",
            get(conversations_controller::get_email_status),
        )
        .route(
            "/api/conversations",
            get(conversations_controller::list_conversations),
        )
        .route(
            "/api/conversations/:id",
            get(conversations_controller::get_conversation),
        )
        .route(
            "/api/conversations/:id/reply",
            post(conversations_controller::reply_to_conversation),
        )
        .route(
            "/api/conversations/:id/forward",
            post(conversations_controller::forward_conversation),
        )
        .route(
            "/api/conversations/:id/mark-read",
            post(conversations_controller::mark_conversation_read),
        )
        .route(
            "/api/conversations/:id/mark-unread",
            post(conversations_controller::mark_conversation_unread),
        )
        .route(
            "/api/conversations/:id/archive",
            post(conversations_controller::archive_conversation),
        )
        .route(
            "/api/conversations/:id/unarchive",
            post(conversations_controller::unarchive_conversation),
        )
        .route(
            "/api/conversations/:id/attachments/:attachment_id",
            get(conversations_controller::download_attachment),
        )
        // Activity tracking routes
        .route(
            "/api/activity/plan",
            get(get_weekly_activity_plan).put(update_weekly_activity_plan),
        )
        .route(
            "/api/activity/plan/:id/close",
            post(close_weekly_activity_plan),
        )
        .route("/api/activity/summary", get(get_weekly_activity_summary))
        .route("/api/activity/feed", get(list_activity_feed))
        .layer(cors)
        .with_state(state);

    // Run server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
