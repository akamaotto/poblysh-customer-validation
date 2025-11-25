use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, QueryOrder, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    auth::{
        middleware::{AdminUser, AuthUser},
        password, rbac,
    },
    entities::user,
};

// Request/Response DTOs
#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
    pub role: String, // "admin" or "user"
}

#[derive(Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub name: Option<String>,
    pub role: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    pub new_password: String,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub email_verified: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<user::Model> for UserResponse {
    fn from(user: user::Model) -> Self {
        UserResponse {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            is_active: user.is_active,
            email_verified: user.email_verified,
            created_at: user.created_at.to_string(),
            updated_at: user.updated_at.to_string(),
        }
    }
}

#[derive(Serialize)]
pub struct MessageResponse {
    pub message: String,
}

/// GET /api/users
/// List all users (admin only)
pub async fn list_users(
    State(db): State<DatabaseConnection>,
    admin: AdminUser,
) -> Result<Json<Vec<UserResponse>>, StatusCode> {
    if !rbac::can_list_users(&admin.0) {
        return Err(StatusCode::FORBIDDEN);
    }

    let users = user::Entity::find()
        .order_by_desc(user::Column::CreatedAt)
        .all(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(users.into_iter().map(UserResponse::from).collect()))
}

/// POST /api/users
/// Create a new user (admin only)
pub async fn create_user(
    State(db): State<DatabaseConnection>,
    admin: AdminUser,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, StatusCode> {
    if !rbac::can_create_user(&admin.0) {
        return Err(StatusCode::FORBIDDEN);
    }

    // Validate role
    if payload.role != "admin" && payload.role != "user" {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Hash password
    let password_hash = password::hash_password(&payload.password)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Create user
    let now = Utc::now().naive_utc();
    let new_user = user::ActiveModel {
        id: Set(Uuid::new_v4()),
        email: Set(payload.email),
        password_hash: Set(password_hash),
        name: Set(payload.name),
        role: Set(payload.role),
        is_active: Set(true),
        email_verified: Set(false),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let user_model = new_user
        .insert(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(user_model.into()))
}

/// GET /api/users/:id
/// Get user by ID (admin or self)
pub async fn get_user(
    State(db): State<DatabaseConnection>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>, StatusCode> {
    let target_user = user::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !rbac::can_view_user(&auth_user.0, &target_user) {
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(Json(target_user.into()))
}

/// PUT /api/users/:id
/// Update user (admin or self, limited fields for self)
pub async fn update_user(
    State(db): State<DatabaseConnection>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, StatusCode> {
    let target_user = user::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !rbac::can_modify_user(&auth_user.0, &target_user) {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut active_user: user::ActiveModel = target_user.into();

    // Only admins can change role and is_active
    if auth_user.0.is_admin() {
        if let Some(email) = payload.email {
            active_user.email = Set(email);
        }
        if let Some(role) = payload.role {
            if role != "admin" && role != "user" {
                return Err(StatusCode::BAD_REQUEST);
            }
            active_user.role = Set(role);
        }
        if let Some(is_active) = payload.is_active {
            active_user.is_active = Set(is_active);
        }
    }

    // Both admins and users can update their own name
    if let Some(name) = payload.name {
        active_user.name = Set(Some(name));
    }

    active_user.updated_at = Set(Utc::now().naive_utc());

    let updated_user = active_user
        .update(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(updated_user.into()))
}

/// DELETE /api/users/:id
/// Delete user (admin only)
pub async fn delete_user(
    State(db): State<DatabaseConnection>,
    admin: AdminUser,
    Path(id): Path<Uuid>,
) -> Result<Json<MessageResponse>, StatusCode> {
    let target_user = user::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !rbac::can_delete_user(&admin.0, &target_user) {
        return Err(StatusCode::FORBIDDEN);
    }

    let active_user: user::ActiveModel = target_user.into();
    active_user
        .delete(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(MessageResponse {
        message: "User deleted successfully".to_string(),
    }))
}

/// PUT /api/users/:id/password
/// Change user password (admin or self)
pub async fn change_password(
    State(db): State<DatabaseConnection>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Json<MessageResponse>, StatusCode> {
    let target_user = user::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if !rbac::can_change_password(&auth_user.0, &target_user) {
        return Err(StatusCode::FORBIDDEN);
    }

    // Hash new password
    let password_hash = password::hash_password(&payload.new_password)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut active_user: user::ActiveModel = target_user.into();
    active_user.password_hash = Set(password_hash);
    active_user.updated_at = Set(Utc::now().naive_utc());

    active_user
        .update(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(MessageResponse {
        message: "Password changed successfully".to_string(),
    }))
}
