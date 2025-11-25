use crate::entities::user;

/// Check if a user can create other users
pub fn can_create_user(user: &user::Model) -> bool {
    user.is_admin()
}

/// Check if a user can delete another user
pub fn can_delete_user(actor: &user::Model, _target: &user::Model) -> bool {
    // Only admins can delete users
    // Note: This allows admins to delete other admins, including themselves
    actor.is_admin()
}

/// Check if a user can modify another user
pub fn can_modify_user(actor: &user::Model, target: &user::Model) -> bool {
    // Admins can modify anyone
    // Users can only modify themselves
    actor.is_admin() || actor.id == target.id
}

/// Check if a user can change another user's password
pub fn can_change_password(actor: &user::Model, target: &user::Model) -> bool {
    // Admins can change anyone's password
    // Users can only change their own password
    actor.is_admin() || actor.id == target.id
}

/// Check if a user can view all users
pub fn can_list_users(user: &user::Model) -> bool {
    user.is_admin()
}

/// Check if a user can view another user's details
pub fn can_view_user(actor: &user::Model, target: &user::Model) -> bool {
    // Admins can view anyone
    // Users can only view themselves
    actor.is_admin() || actor.id == target.id
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    fn create_test_user(role: &str) -> user::Model {
        user::Model {
            id: Uuid::new_v4(),
            email: format!("test_{}@example.com", role),
            password_hash: "hash".to_string(),
            name: Some(format!("Test {}", role)),
            role: role.to_string(),
            is_active: true,
            email_verified: true,
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
        }
    }

    #[test]
    fn test_admin_permissions() {
        let admin = create_test_user("admin");
        let user = create_test_user("user");

        assert!(can_create_user(&admin));
        assert!(can_delete_user(&admin, &user));
        assert!(can_modify_user(&admin, &user));
        assert!(can_change_password(&admin, &user));
        assert!(can_list_users(&admin));
        assert!(can_view_user(&admin, &user));
    }

    #[test]
    fn test_user_permissions() {
        let user1 = create_test_user("user");
        let user2 = create_test_user("user");

        assert!(!can_create_user(&user1));
        assert!(!can_delete_user(&user1, &user2));
        assert!(!can_modify_user(&user1, &user2));
        assert!(!can_change_password(&user1, &user2));
        assert!(!can_list_users(&user1));
        assert!(!can_view_user(&user1, &user2));

        // Users can modify themselves
        assert!(can_modify_user(&user1, &user1));
        assert!(can_change_password(&user1, &user1));
        assert!(can_view_user(&user1, &user1));
    }
}
