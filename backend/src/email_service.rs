use resend_rs::{
    types::{CreateEmailBaseOptions, EmailEvent},
    Resend,
};
use serde::{Deserialize, Serialize};
use std::{env, error::Error as StdError, fmt};

#[derive(Clone)]
pub struct EmailService {
    client: Resend,
    default_from_email: String,
    default_from_name: String,
}

#[derive(Debug)]
pub enum EmailServiceError {
    MissingRecipient,
    Transport(resend_rs::Error),
}

impl fmt::Display for EmailServiceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EmailServiceError::MissingRecipient => f.write_str("contact is missing an email"),
            EmailServiceError::Transport(err) => write!(f, "failed to call Resend API: {err}"),
        }
    }
}

impl StdError for EmailServiceError {}

impl From<resend_rs::Error> for EmailServiceError {
    fn from(value: resend_rs::Error) -> Self {
        EmailServiceError::Transport(value)
    }
}

#[derive(Debug, Clone)]
pub struct EmailSendResult {
    pub message_id: String,
    pub delivery_status: String,
}

#[derive(Debug, Clone)]
pub struct EmailStatusResult {
    pub status: String,
}

#[derive(Debug, Clone)]
pub struct TemplateContent {
    pub subject: String,
    pub html_body: String,
    pub text_body: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum EmailTemplateKind {
    Intro,
    FollowUp,
    #[default]
    Custom,
}

impl EmailTemplateKind {
    pub fn display_name(&self) -> &'static str {
        match self {
            EmailTemplateKind::Intro => "Intro",
            EmailTemplateKind::FollowUp => "Follow-up",
            EmailTemplateKind::Custom => "Custom",
        }
    }

    pub fn defaults(&self, contact_name: &str, startup_name: &str) -> TemplateContent {
        match self {
            EmailTemplateKind::Intro => TemplateContent {
                subject: format!("Quick intro from Poblysh for {}", startup_name),
                html_body: format!(
                    "<p>Hi {},</p>\
                     <p>Wanted to introduce you to Poblysh — we help teams like {} accelerate their customer validation work without adding more tools to their stack.</p>\
                     <p>Are you open to a short call this week to walk through how we're helping other teams track outreach and insights?</p>\
                     <p>Best,<br/>The Poblysh team</p>",
                    contact_name, startup_name
                ),
                text_body: format!(
                    "Hi {},\n\nWanted to introduce you to Poblysh — we help teams like {} accelerate their customer validation work without adding more tools to their stack.\n\nAre you open to a short call this week to walk through how we're helping other teams track outreach and insights?\n\nBest,\nThe Poblysh team",
                    contact_name, startup_name
                ),
            },
            EmailTemplateKind::FollowUp => TemplateContent {
                subject: format!("Following up on Poblysh <> {}", startup_name),
                html_body: format!(
                    "<p>Hi {},</p>\
                     <p>Just checking back in on Poblysh. Happy to send a short Loom or find time live if you still want to see how teams are logging outreach + interviews in one place.</p>\
                     <p>Let me know what works best for you.</p>\
                     <p>Thanks,<br/>The Poblysh team</p>",
                    contact_name
                ),
                text_body: format!(
                    "Hi {},\n\nJust checking back in on Poblysh. Happy to send a short Loom or find time live if you still want to see how teams are logging outreach + interviews in one place.\n\nLet me know what works best for you.\n\nThanks,\nThe Poblysh team",
                    contact_name
                ),
            },
            EmailTemplateKind::Custom => TemplateContent {
                subject: String::new(),
                html_body: String::new(),
                text_body: String::new(),
            },
        }
    }
}

impl EmailService {
    pub fn from_env() -> Self {
        let api_key = env::var("RESEND_API_KEY")
            .unwrap_or_else(|_| "re_2e4Z66JC_LNeXNmJZwKY1ginQKuHMvyRB".to_string());
        let default_from_email =
            env::var("RESEND_FROM_EMAIL").unwrap_or_else(|_| "noreply@poblysh.com".to_string());
        let default_from_name =
            env::var("RESEND_FROM_NAME").unwrap_or_else(|_| "Poblysh".to_string());

        Self {
            client: Resend::new(&api_key),
            default_from_email,
            default_from_name,
        }
    }

    pub async fn send_contact_email(
        &self,
        to: Option<&String>,
        sender_name: &str,
        sender_email: &str,
        subject: &str,
        html_body: &str,
        text_body: &str,
    ) -> Result<EmailSendResult, EmailServiceError> {
        let recipient = to.ok_or(EmailServiceError::MissingRecipient)?;

        let mut payload = CreateEmailBaseOptions::new(
            self.sender_address(sender_name, sender_email),
            [recipient.as_str()],
            subject,
        )
        .with_html(html_body);

        if !text_body.trim().is_empty() {
            payload = payload.with_text(text_body);
        }

        let response = self.client.emails.send(payload).await?;
        Ok(EmailSendResult {
            message_id: response.id.to_string(),
            delivery_status: "queued".to_string(),
        })
    }

    pub async fn fetch_status(
        &self,
        message_id: &str,
    ) -> Result<EmailStatusResult, EmailServiceError> {
        let email = self.client.emails.get(message_id).await?;
        Ok(EmailStatusResult {
            status: event_to_status(email.last_event).to_string(),
        })
    }

    fn sender_address(&self, sender_name: &str, sender_email: &str) -> String {
        let trimmed_email = sender_email.trim();
        let name = if sender_name.trim().is_empty() {
            if trimmed_email.is_empty() {
                self.default_from_name.clone()
            } else {
                trimmed_email.to_string()
            }
        } else {
            sender_name.trim().to_string()
        };

        if trimmed_email.is_empty() {
            format!("{} <{}>", name, self.default_from_email)
        } else {
            format!("{} <{}>", name, trimmed_email)
        }
    }
}

fn event_to_status(event: EmailEvent) -> &'static str {
    match event {
        EmailEvent::Bounced => "bounced",
        EmailEvent::Canceled => "canceled",
        EmailEvent::Clicked => "clicked",
        EmailEvent::Complained => "complained",
        EmailEvent::Delivered => "delivered",
        EmailEvent::DeliveryDelayed => "delivery-delayed",
        EmailEvent::Failed => "failed",
        EmailEvent::Opened => "opened",
        EmailEvent::Queued => "queued",
        EmailEvent::Scheduled => "scheduled",
        EmailEvent::Sent => "sent",
    }
}
