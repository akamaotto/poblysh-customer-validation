use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize)]
struct ResendEmailRequest {
    from: String,
    to: Vec<String>,
    subject: String,
    html: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ResendEmailResponse {
    id: String,
}

/// Send a password reset email via Resend
pub async fn send_password_reset_email(
    to_email: &str,
    reset_token: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let api_key = env::var("RESEND_API_KEY")
        .unwrap_or_else(|_| "re_2e4Z66JC_LNeXNmJZwKY1ginQKuHMvyRB".to_string());
    let from_email =
        env::var("RESEND_FROM_EMAIL").unwrap_or_else(|_| "noreply@poblysh.com".to_string());
    let from_name = env::var("RESEND_FROM_NAME").unwrap_or_else(|_| "Poblysh".to_string());
    let frontend_url =
        env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());

    let reset_link = format!("{}/reset-password?token={}", frontend_url, reset_token);

    let html_body = format!(
        r#"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
                <p>You requested to reset your password for your Poblysh account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #007bff;">{}</p>
                <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                    This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
        "#,
        reset_link, reset_link
    );

    let email_request = ResendEmailRequest {
        from: format!("{} <{}>", from_name, from_email),
        to: vec![to_email.to_string()],
        subject: "Reset Your Password".to_string(),
        html: html_body,
    };

    let client = Client::new();
    let response = client
        .post("https://api.resend.com/emails")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&email_request)
        .send()
        .await?;

    if response.status().is_success() {
        let _result: ResendEmailResponse = response.json().await?;
        tracing::info!("Password reset email sent to {}", to_email);
        Ok(())
    } else {
        let error_text = response.text().await?;
        tracing::error!("Failed to send email: {}", error_text);
        Err(format!("Failed to send email: {}", error_text).into())
    }
}
