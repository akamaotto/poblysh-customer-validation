use crate::entities::email_credential;
use crate::services::encryption_service::EncryptionService;
use lettre::message::header::ContentType;
use lettre::message::{Attachment, Mailbox, MultiPart, SinglePart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncTransport, Message};
use mime::Mime;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use uuid::Uuid;

pub struct OutgoingAttachment {
    pub file_name: String,
    pub content_type: String,
    pub data: Vec<u8>,
    pub is_inline: bool,
    pub content_id: Option<String>,
}

pub struct SmtpService {
    db: DatabaseConnection,
    encryption_service: EncryptionService,
}

impl SmtpService {
    pub fn new(db: DatabaseConnection, encryption_service: EncryptionService) -> Self {
        Self {
            db,
            encryption_service,
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn send_email(
        &self,
        user_id: Uuid,
        to: &[String],
        cc: &[String],
        bcc: &[String],
        subject: &str,
        body_text: Option<&str>,
        body_html: Option<&str>,
        attachments: &[OutgoingAttachment],
    ) -> Result<(), String> {
        if to.is_empty() && cc.is_empty() && bcc.is_empty() {
            return Err("At least one recipient is required".to_string());
        }

        let creds = email_credential::Entity::find()
            .filter(email_credential::Column::UserId.eq(user_id))
            .one(&self.db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or("No email credentials found")?;

        let password = self
            .encryption_service
            .decrypt(&creds.encrypted_password, &creds.nonce)?;

        let mut builder = Message::builder()
            .from(parse_mailbox(&creds.email)?)
            .subject(subject);

        for addr in to {
            builder = builder.to(parse_mailbox(addr)?);
        }
        for addr in cc {
            builder = builder.cc(parse_mailbox(addr)?);
        }
        for addr in bcc {
            builder = builder.bcc(parse_mailbox(addr)?);
        }

        let text_part = body_text.map(|text| {
            SinglePart::builder()
                .header(ContentType::TEXT_PLAIN)
                .body(text.to_string())
        });
        let html_part = body_html.map(|html| {
            SinglePart::builder()
                .header(ContentType::TEXT_HTML)
                .body(html.to_string())
        });

        let multipart_body = build_body(text_part, html_part, attachments)?;

        let email = builder
            .multipart(multipart_body)
            .map_err(|e| e.to_string())?;

        use lettre::AsyncSmtpTransport;
        use lettre::Tokio1Executor;

        let creds_obj = Credentials::new(creds.email, password);
        let mailer: AsyncSmtpTransport<Tokio1Executor> =
            AsyncSmtpTransport::<Tokio1Executor>::relay(&creds.smtp_host)
                .map_err(|e| e.to_string())?
                .credentials(creds_obj)
                .port(creds.smtp_port as u16)
                .build();

        mailer.send(email).await.map_err(|e| e.to_string())?;

        Ok(())
    }
}

fn parse_mailbox(input: &str) -> Result<Mailbox, String> {
    input
        .parse::<Mailbox>()
        .map_err(|_| format!("Invalid email address: {}", input))
}

fn build_body(
    text_part: Option<SinglePart>,
    html_part: Option<SinglePart>,
    attachments: &[OutgoingAttachment],
) -> Result<MultiPart, String> {
    let mut parts = Vec::new();
    if let Some(text) = text_part {
        parts.push(text);
    }
    if let Some(html) = html_part {
        parts.push(html);
    }
    if parts.is_empty() {
        parts.push(
            SinglePart::builder()
                .header(ContentType::TEXT_PLAIN)
                .body(String::new()),
        );
    }

    let mut alternative = MultiPart::alternative().build();
    for part in parts {
        alternative = alternative.singlepart(part);
    }

    let mut mixed = MultiPart::mixed().build().multipart(alternative);
    for attachment in attachments {
        mixed = mixed.singlepart(build_attachment_part(attachment)?);
    }

    Ok(mixed)
}

fn build_attachment_part(attachment: &OutgoingAttachment) -> Result<SinglePart, String> {
    let mime_type: Mime = attachment
        .content_type
        .parse()
        .map_err(|_| format!("Invalid content type {}", attachment.content_type))?;
    let mime_string = mime_type.to_string();
    let content_type =
        ContentType::parse(&mime_string).map_err(|_| "Failed to parse content type".to_string())?;

    let part = if attachment.is_inline {
        Attachment::new_inline(attachment.file_name.clone())
            .body(attachment.data.clone(), content_type)
    } else {
        Attachment::new(attachment.file_name.clone()).body(attachment.data.clone(), content_type)
    };

    Ok(part)
}
