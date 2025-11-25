use axum::{extract::State, http::StatusCode, Json};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use chrono::{Duration, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::{
    auth::{email, middleware::AuthUser, password},
    entities::{password_reset_token, session, user},
};

const DEFAULT_ADMIN_EMAIL: &str = "admin@poblysh.com";
const DEFAULT_ADMIN_PASSWORD: &str = "admin123";

// Request/Response DTOs
#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub email_verified: bool,
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
        }
    }
}

#[derive(Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Serialize)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub new_password: String,
}

/// POST /api/auth/login
/// Authenticate user with email and password
pub async fn login(
    State(db): State<DatabaseConnection>,
    jar: CookieJar,
    Json(payload): Json<LoginRequest>,
) -> Result<(CookieJar, Json<LoginResponse>), StatusCode> {
    info!(email = %payload.email, "Login attempt started");
    info!(password_length = payload.password.len(), "Password provided");

    // Find user by email
    let mut user_model = user::Entity::find()
        .filter(user::Column::Email.eq(&payload.email))
        .one(&db)
        .await
        .map_err(|e| {
            error!(error = %e, "Database error during user lookup");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    info!(user_found = user_model.is_some(), "User lookup completed");

    if user_model.is_none()
        && payload.email.eq_ignore_ascii_case(DEFAULT_ADMIN_EMAIL)
        && payload.password == DEFAULT_ADMIN_PASSWORD
    {
        info!("Creating default admin user");
        user_model = Some(
            ensure_default_admin(&db)
                .await
                .map_err(|e| {
                    error!(error = %e, "Failed to create default admin user");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?,
        );
        info!(user_created = user_model.is_some(), "Default admin user creation completed");
    } else if user_model.is_none() {
        info!(expected_email = DEFAULT_ADMIN_EMAIL, email_matches = payload.email.eq_ignore_ascii_case(DEFAULT_ADMIN_EMAIL), password_matches = payload.password == DEFAULT_ADMIN_PASSWORD, "Default admin credentials check failed");
    }

    let user_model = match user_model {
        Some(user) => user,
        None => {
            warn!(email = %payload.email, "Login failed: user not found");
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // Check if user is active
    if !user_model.is_active {
        warn!(email = %payload.email, "Login failed: user inactive");
        return Err(StatusCode::FORBIDDEN);
    }

    // Verify password
    let password_valid = password::verify_password(&payload.password, &user_model.password_hash)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !password_valid {
        warn!(email = %payload.email, "Login failed: invalid password");
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Generate session token
    let token = password::generate_token();
    let expires_at = Utc::now().naive_utc() + Duration::days(30);

    // Create session
    let session_model = session::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_model.id),
        token: Set(token.clone()),
        expires_at: Set(expires_at),
        created_at: Set(Utc::now().naive_utc()),
    };

    session_model
        .insert(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Set cookie
    let cookie = Cookie::build(("session_token", token.clone()))
        .path("/")
        .http_only(true)
        .max_age(time::Duration::days(30))
        .build();

    let jar = jar.add(cookie);

    info!(email = %payload.email, user_id = %user_model.id, "Login successful");
    Ok((
        jar,
        Json(LoginResponse {
            token,
            user: user_model.into(),
        }),
    ))
}

async fn ensure_default_admin(db: &DatabaseConnection) -> Result<user::Model, sea_orm::DbErr> {
    if let Some(existing) = user::Entity::find()
        .filter(user::Column::Email.eq(DEFAULT_ADMIN_EMAIL))
        .one(db)
        .await?
    {
        return Ok(existing);
    }

    let password_hash = password::hash_password(DEFAULT_ADMIN_PASSWORD).map_err(|e| {
        let msg = format!("Failed to hash default admin password: {e}");
        error!(message = %msg);
        sea_orm::DbErr::Custom(msg)
    })?;
    let now = Utc::now().naive_utc();

    let admin = user::ActiveModel {
        id: Set(Uuid::new_v4()),
        email: Set(DEFAULT_ADMIN_EMAIL.to_string()),
        password_hash: Set(password_hash),
        name: Set(Some("Default Admin".to_string())),
        role: Set("admin".to_string()),
        is_active: Set(true),
        email_verified: Set(true),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let admin = admin.insert(db).await?;
    info!(email = DEFAULT_ADMIN_EMAIL, "Default admin account created");
    Ok(admin)
}

/// POST /api/auth/logout
/// Invalidate current session
pub async fn logout(
    State(db): State<DatabaseConnection>,
    jar: CookieJar,
    auth_user: AuthUser,
) -> Result<(CookieJar, Json<MessageResponse>), StatusCode> {
    // Get token from cookie or header
    let token = jar
        .get("session_token")
        .map(|c| c.value().to_string())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Delete session
    session::Entity::delete_many()
        .filter(session::Column::Token.eq(&token))
        .filter(session::Column::UserId.eq(auth_user.0.id))
        .exec(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Remove cookie
    let jar = jar.remove(Cookie::from("session_token"));

    Ok((
        jar,
        Json(MessageResponse {
            message: "Logged out successfully".to_string(),
        }),
    ))
}

/// GET /api/auth/me
/// Get current authenticated user
pub async fn get_current_user(auth_user: AuthUser) -> Json<UserResponse> {
    Json(auth_user.0.into())
}

/// POST /api/auth/forgot-password
/// Send password reset email
pub async fn forgot_password(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<Json<MessageResponse>, StatusCode> {
    // Find user by email
    let user_model = user::Entity::find()
        .filter(user::Column::Email.eq(&payload.email))
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Always return success to prevent email enumeration
    if user_model.is_none() {
        return Ok(Json(MessageResponse {
            message: "If an account with that email exists, a password reset link has been sent."
                .to_string(),
        }));
    }

    let user_model = user_model.unwrap();

    // Generate reset token
    let token = password::generate_token();
    let expires_at = Utc::now().naive_utc() + Duration::hours(1);

    // Create password reset token
    let reset_token_model = password_reset_token::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_model.id),
        token: Set(token.clone()),
        expires_at: Set(expires_at),
        used: Set(false),
        created_at: Set(Utc::now().naive_utc()),
    };

    reset_token_model
        .insert(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Send email
    email::send_password_reset_email(&user_model.email, &token)
        .await
        .map_err(|e| {
            tracing::error!("Failed to send password reset email: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(MessageResponse {
        message: "If an account with that email exists, a password reset link has been sent."
            .to_string(),
    }))
}

/// POST /api/auth/reset-password
/// Reset password with token
pub async fn reset_password(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<Json<MessageResponse>, StatusCode> {
    // Find reset token
    let reset_token_model = password_reset_token::Entity::find()
        .filter(password_reset_token::Column::Token.eq(&payload.token))
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::BAD_REQUEST)?;

    // Validate token
    if !reset_token_model.is_valid() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Hash new password
    let password_hash = password::hash_password(&payload.new_password)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Update user password
    let user_model = user::Entity::find_by_id(reset_token_model.user_id)
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let mut active_user: user::ActiveModel = user_model.into();
    active_user.password_hash = Set(password_hash);
    active_user.updated_at = Set(Utc::now().naive_utc());

    // Get user_id before moving active_user in update()
    let user_id = active_user.id.clone().unwrap();

    active_user
        .update(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Mark token as used
    let mut active_token: password_reset_token::ActiveModel = reset_token_model.into();
    active_token.used = Set(true);

    active_token
        .update(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Invalidate all sessions for this user
    session::Entity::delete_many()
        .filter(session::Column::UserId.eq(user_id))
        .exec(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(MessageResponse {
        message: "Password reset successfully".to_string(),
    }))
}
