use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::extract::CookieJar;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::entities::{session, user};

/// Authenticated user extractor
/// Use this in route handlers to require authentication
#[derive(Clone, Debug)]
pub struct AuthUser(pub user::Model);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    DatabaseConnection: FromRef<S>,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // Extract database connection from state
        let db = DatabaseConnection::from_ref(state);

        // Try to get token from Authorization header first
        let token = if let Some(auth_header) = parts.headers.get("Authorization") {
            auth_header
                .to_str()
                .ok()
                .and_then(|h| h.strip_prefix("Bearer "))
                .map(|t| t.to_string())
        } else {
            // Fall back to cookie
            let jar: CookieJar = parts
                .extract()
                .await
                .map_err(|_| StatusCode::UNAUTHORIZED)?;
            jar.get("session_token").map(|c| c.value().to_string())
        };

        let token = token.ok_or(StatusCode::UNAUTHORIZED)?;

        // Find session by token
        let session_model = session::Entity::find()
            .filter(session::Column::Token.eq(&token))
            .one(&db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .ok_or(StatusCode::UNAUTHORIZED)?;

        // Check if session is expired
        if session_model.is_expired() {
            return Err(StatusCode::UNAUTHORIZED);
        }

        // Find user by session
        let user_model = user::Entity::find_by_id(session_model.user_id)
            .one(&db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .ok_or(StatusCode::UNAUTHORIZED)?;

        // Check if user is active
        if !user_model.is_active {
            return Err(StatusCode::FORBIDDEN);
        }

        Ok(AuthUser(user_model))
    }
}

/// Admin user extractor
/// Use this in route handlers to require admin role
#[derive(Clone, Debug)]
pub struct AdminUser(pub user::Model);

#[async_trait]
impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync,
    DatabaseConnection: FromRef<S>,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // First authenticate the user
        let AuthUser(user_model) = AuthUser::from_request_parts(parts, state).await?;

        // Check if user is admin
        if !user_model.is_admin() {
            return Err(StatusCode::FORBIDDEN);
        }

        Ok(AdminUser(user_model))
    }
}
