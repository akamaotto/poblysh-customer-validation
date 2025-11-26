use crate::entities::{contact, conversation, email_attachment, email_credential, message};
use crate::services::encryption_service::EncryptionService;
use async_native_tls::TlsConnector;
use chrono::{DateTime, FixedOffset, Utc};
use futures::StreamExt;
use mailparse::{addrparse, parse_mail, DispositionType, MailAddr, MailHeaderMap, ParsedMail};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use serde_json::json;
use tokio::net::TcpStream;
use tokio_util::compat::{Compat, FuturesAsyncReadCompatExt, TokioAsyncReadCompatExt};
use tracing::error;
use uuid::Uuid;

type ImapStream = Compat<async_native_tls::TlsStream<Compat<TcpStream>>>;

pub struct ImapService {
    db: DatabaseConnection,
    encryption_service: EncryptionService,
}

#[derive(Default)]
pub struct SyncResult {
    pub processed_count: usize,
    pub last_uid: Option<u32>,
}

impl ImapService {
    pub fn new(db: DatabaseConnection, encryption_service: EncryptionService) -> Self {
        Self {
            db,
            encryption_service,
        }
    }

    pub async fn sync_all_users(&self) -> Result<(), String> {
        let users = email_credential::Entity::find()
            .filter(email_credential::Column::SyncEnabled.eq(true))
            .all(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        for creds in users {
            if let Err(err) = self.sync_user_emails(creds.user_id).await {
                error!(
                    error = %err,
                    user_id = %creds.user_id,
                    "email sync failed"
                );
            }
        }

        Ok(())
    }

    pub async fn sync_user_emails(&self, user_id: Uuid) -> Result<SyncResult, String> {
        let creds = email_credential::Entity::find()
            .filter(email_credential::Column::UserId.eq(user_id))
            .one(&self.db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or("No email credentials found")?;

        let status = creds.clone();
        let password = self
            .encryption_service
            .decrypt(&creds.encrypted_password, &creds.nonce)?;

        let result = self.perform_sync(&creds, &password).await.map_err(|err| {
            let mut active: email_credential::ActiveModel = status.clone().into();
            let now = Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap());
            active.last_sync_attempt_at = Set(Some(now));
            active.last_sync_error = Set(Some(err.clone()));
            active.sync_status = Set("error".to_string());
            let _ = active.update(&self.db);
            err
        })?;

        let mut active: email_credential::ActiveModel = status.into();
        let now = Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap());
        active.last_synced_at = Set(Some(now));
        active.last_sync_attempt_at = Set(Some(now));
        active.last_sync_error = Set(None);
        active.sync_status = Set("connected".to_string());
        if let Some(uid) = result.last_uid {
            active.sync_cursor = Set(Some(uid as i32));
        }
        active.update(&self.db).await.map_err(|e| e.to_string())?;

        Ok(result)
    }

    pub async fn test_credentials(
        &self,
        email: &str,
        password: &str,
        host: &str,
        port: i32,
    ) -> Result<(), String> {
        let mut session = self.open_session(email, password, host, port).await?;
        session
            .select("INBOX")
            .await
            .map_err(|e| format!("IMAP select error: {}", e))?;
        session
            .logout()
            .await
            .map_err(|e| format!("IMAP logout error: {}", e))?;
        Ok(())
    }

    async fn perform_sync(
        &self,
        creds: &email_credential::Model,
        password: &str,
    ) -> Result<SyncResult, String> {
        let mut session = self
            .open_session(&creds.email, password, &creds.imap_host, creds.imap_port)
            .await?;
        session
            .select("INBOX")
            .await
            .map_err(|e| format!("IMAP select error: {}", e))?;

        let start_uid = creds
            .sync_cursor
            .map(|cursor| (cursor + 1).max(1) as u32)
            .unwrap_or(1);
        let fetch_range = if start_uid <= 1 {
            "1:*".to_string()
        } else {
            format!("{}:*", start_uid)
        };

        let mut stream = session
            .uid_fetch(fetch_range, "(RFC822 FLAGS UID INTERNALDATE)")
            .await
            .map_err(|e| e.to_string())?;

        let mut result = SyncResult::default();

        while let Some(msg_result) = stream.next().await {
            let msg = msg_result.map_err(|e| e.to_string())?;
            let uid = msg.uid.ok_or("Missing UID on message")?;
            result.last_uid = Some(uid);

            let body = msg.body().ok_or("Missing message body")?;
            let parsed = parse_mail(body).map_err(|e| e.to_string())?;

            if self.message_exists(&parsed).await? {
                continue;
            }

            let flags = msg.flags().collect::<Vec<_>>();
            self.persist_message(creds, &parsed, uid, &flags).await?;
            result.processed_count += 1;
        }

        drop(stream);
        session
            .logout()
            .await
            .map_err(|e| format!("Logout error: {}", e))?;

        Ok(result)
    }

    async fn open_session(
        &self,
        email: &str,
        password: &str,
        host: &str,
        port: i32,
    ) -> Result<async_imap::Session<ImapStream>, String> {
        let tcp_stream = TcpStream::connect((host, port as u16))
            .await
            .map_err(|e| format!("TCP connect error: {}", e))?;

        let tls = TlsConnector::new();
        let tls_stream = tls
            .connect(host, tcp_stream.compat())
            .await
            .map_err(|e| format!("TLS handshake error: {}", e))?;

        let compat_stream = tls_stream.compat();
        let client = async_imap::Client::new(compat_stream);

        client
            .login(email, password)
            .await
            .map_err(|e| format!("IMAP login error: {}", e.0))
    }

    async fn message_exists(&self, parsed: &ParsedMail<'_>) -> Result<bool, String> {
        if let Some(message_id) = parsed.headers.get_first_value("Message-ID") {
            let exists = message::Entity::find()
                .filter(message::Column::MessageIdHeader.eq(message_id))
                .one(&self.db)
                .await
                .map_err(|e| e.to_string())?;
            Ok(exists.is_some())
        } else {
            Ok(false)
        }
    }

    async fn persist_message(
        &self,
        creds: &email_credential::Model,
        parsed: &ParsedMail<'_>,
        uid: u32,
        flags: &[async_imap::types::Flag<'_>],
    ) -> Result<(), String> {
        let subject = parsed
            .headers
            .get_first_value("Subject")
            .unwrap_or_else(|| "(no subject)".to_string());
        let clean_subject = clean_subject(&subject);
        let sent_at = parsed
            .headers
            .get_first_value("Date")
            .and_then(|date| DateTime::parse_from_rfc2822(&date).ok())
            .map(|dt| dt.with_timezone(&FixedOffset::east_opt(0).unwrap()))
            .unwrap_or_else(|| Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap()));
        let delivered_at = sent_at;
        let is_read = flags
            .iter()
            .any(|f| matches!(f, async_imap::types::Flag::Seen));

        let from_addrs = parse_addresses(parsed.headers.get_first_value("From"));
        let to_addrs = parse_addresses(parsed.headers.get_first_value("To"));
        let cc_addrs = parse_addresses(parsed.headers.get_first_value("Cc"));
        let bcc_addrs = parse_addresses(parsed.headers.get_first_value("Bcc"));

        let direction = if from_addrs
            .iter()
            .any(|addr| addr.email.eq_ignore_ascii_case(&creds.email))
        {
            "sent"
        } else {
            "received"
        }
        .to_string();

        let (text_body, html_body, mut attachment_parts) = extract_bodies(parsed);
        let snippet = text_body
            .clone()
            .or_else(|| html_body.clone())
            .map(|body| truncate_preview(&body));

        let in_reply_to = parsed.headers.get_first_value("In-Reply-To");
        let references = parsed.headers.get_first_value("References");
        let message_id = parsed.headers.get_first_value("Message-ID");
        let thread_identifier = derive_thread_identifier(
            message_id.as_deref(),
            in_reply_to.as_deref(),
            &clean_subject,
        );

        let participant_json = participants_json(&from_addrs, &to_addrs, &cc_addrs, &bcc_addrs);

        let startup_id = self
            .lookup_startup_id(&from_addrs, &to_addrs, &cc_addrs, &bcc_addrs, &creds.email)
            .await?;

        let conversation_id = self
            .ensure_conversation(
                creds.user_id,
                &clean_subject,
                &participant_json,
                sent_at,
                startup_id,
                &thread_identifier,
            )
            .await?;

        let now = Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap());

        let new_message = message::ActiveModel {
            id: Set(Uuid::new_v4()),
            conversation_id: Set(conversation_id),
            user_id: Set(creds.user_id),
            sender_name: Set(from_addrs.get(0).and_then(|addr| addr.name.clone())),
            sender_email: Set(from_addrs
                .get(0)
                .map(|addr| addr.email.clone())
                .unwrap_or_default()),
            subject: Set(subject),
            body_text: Set(text_body),
            body_html: Set(html_body),
            direction: Set(direction.clone()),
            to_emails: Set(to_value(&to_addrs)),
            cc_emails: Set(to_value(&cc_addrs)),
            bcc_emails: Set(to_value(&bcc_addrs)),
            sent_at: Set(sent_at),
            delivered_at: Set(delivered_at),
            read_at: Set(if is_read { Some(now) } else { None }),
            is_read: Set(is_read),
            is_from_me: Set(direction == "sent"),
            imap_uid: Set(Some(uid as i32)),
            message_id_header: Set(message_id),
            in_reply_to: Set(in_reply_to),
            references: Set(references),
            snippet: Set(snippet.clone()),
            has_attachments: Set(!attachment_parts.is_empty()),
            attachment_count: Set(attachment_parts.len() as i32),
            created_at: Set(now),
        };

        let inserted = new_message
            .insert(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        let has_new_attachments = !attachment_parts.is_empty();
        for attachment in attachment_parts.drain(..) {
            let attachment_model = email_attachment::ActiveModel {
                id: Set(Uuid::new_v4()),
                message_id: Set(inserted.id),
                file_name: Set(attachment.file_name),
                content_type: Set(attachment.content_type),
                size_bytes: Set(attachment.size_bytes),
                is_inline: Set(attachment.is_inline),
                content_id: Set(attachment.content_id),
                data: Set(attachment.data),
                created_at: Set(now),
            };
            attachment_model
                .insert(&self.db)
                .await
                .map_err(|e| e.to_string())?;
        }

        self.update_conversation_state(
            conversation_id,
            sent_at,
            snippet,
            has_new_attachments,
            direction == "received" && !is_read,
        )
        .await?;

        Ok(())
    }

    async fn ensure_conversation(
        &self,
        user_id: Uuid,
        subject: &str,
        participants: &serde_json::Value,
        sent_at: DateTime<FixedOffset>,
        startup_id: Option<Uuid>,
        thread_id: &str,
    ) -> Result<Uuid, String> {
        let existing = conversation::Entity::find()
            .filter(conversation::Column::UserId.eq(user_id))
            .filter(conversation::Column::ThreadId.eq(thread_id.to_string()))
            .order_by_desc(conversation::Column::LatestMessageAt)
            .one(&self.db)
            .await
            .map_err(|e| e.to_string())?;

        if let Some(conv) = existing {
            return Ok(conv.id);
        }

        let now = Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap());
        let conv = conversation::ActiveModel {
            id: Set(Uuid::new_v4()),
            user_id: Set(user_id),
            subject: Set(subject.to_string()),
            snippet: Set(None),
            thread_id: Set(Some(thread_id.to_string())),
            startup_id: Set(startup_id),
            latest_message_at: Set(sent_at),
            has_attachments: Set(false),
            is_read: Set(true),
            is_archived: Set(false),
            message_count: Set(0),
            unread_count: Set(0),
            participants: Set(participants.clone()),
            created_at: Set(now),
            updated_at: Set(now),
        };

        let inserted = conv.insert(&self.db).await.map_err(|e| e.to_string())?;
        Ok(inserted.id)
    }

    async fn update_conversation_state(
        &self,
        conversation_id: Uuid,
        latest_at: DateTime<FixedOffset>,
        snippet: Option<String>,
        has_attachments: bool,
        increment_unread: bool,
    ) -> Result<(), String> {
        let conversation = conversation::Entity::find_by_id(conversation_id)
            .one(&self.db)
            .await
            .map_err(|e| e.to_string())?
            .ok_or("Conversation missing")?;

        let unread_count = if increment_unread {
            conversation.unread_count + 1
        } else {
            conversation.unread_count
        };
        let message_count = conversation.message_count + 1;
        let mut active: conversation::ActiveModel = conversation.into();
        active.latest_message_at = Set(latest_at);
        active.updated_at = Set(Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap()));
        active.snippet = Set(snippet);
        active.has_attachments = Set(has_attachments || active.has_attachments.unwrap());
        active.message_count = Set(message_count);
        active.unread_count = Set(unread_count);
        active.is_read = Set(unread_count == 0);
        active.update(&self.db).await.map_err(|e| e.to_string())?;

        Ok(())
    }

    async fn lookup_startup_id(
        &self,
        from: &[ParsedAddress],
        to: &[ParsedAddress],
        cc: &[ParsedAddress],
        bcc: &[ParsedAddress],
        user_email: &str,
    ) -> Result<Option<Uuid>, String> {
        let mut candidates = Vec::new();
        candidates.extend(from.iter().cloned());
        candidates.extend(to.iter().cloned());
        candidates.extend(cc.iter().cloned());
        candidates.extend(bcc.iter().cloned());

        for addr in candidates {
            if addr.email.eq_ignore_ascii_case(user_email) {
                continue;
            }
            if let Some(contact) = contact::Entity::find()
                .filter(contact::Column::Email.eq(addr.email.clone()))
                .one(&self.db)
                .await
                .map_err(|e| e.to_string())?
            {
                return Ok(Some(contact.startup_id));
            }
        }

        Ok(None)
    }
}

#[derive(Clone)]
struct ParsedAddress {
    email: String,
    name: Option<String>,
}

struct AttachmentPart {
    file_name: String,
    content_type: String,
    size_bytes: i64,
    is_inline: bool,
    content_id: Option<String>,
    data: Vec<u8>,
}

fn parse_addresses(header: Option<String>) -> Vec<ParsedAddress> {
    let raw = match header {
        Some(raw) => raw,
        None => return Vec::new(),
    };

    match addrparse(&raw) {
        Ok(list) => list
            .iter()
            .flat_map(|addr| match addr {
                MailAddr::Single(info) => vec![ParsedAddress {
                    email: info.addr.to_lowercase(),
                    name: info.display_name.clone(),
                }],
                MailAddr::Group(group) => group
                    .addrs
                    .iter()
                    .map(|single| ParsedAddress {
                        email: single.addr.to_lowercase(),
                        name: single.display_name.clone(),
                    })
                    .collect::<Vec<_>>(),
            })
            .collect(),
        Err(_) => Vec::new(),
    }
}

fn participants_json(
    from: &[ParsedAddress],
    to: &[ParsedAddress],
    cc: &[ParsedAddress],
    bcc: &[ParsedAddress],
) -> serde_json::Value {
    let mut participants = Vec::new();
    for addr in from {
        participants.push(json!({ "role": "from", "email": addr.email, "name": addr.name }));
    }
    for addr in to {
        participants.push(json!({ "role": "to", "email": addr.email, "name": addr.name }));
    }
    for addr in cc {
        participants.push(json!({ "role": "cc", "email": addr.email, "name": addr.name }));
    }
    for addr in bcc {
        participants.push(json!({ "role": "bcc", "email": addr.email, "name": addr.name }));
    }
    serde_json::Value::Array(participants)
}

fn to_value(addrs: &[ParsedAddress]) -> serde_json::Value {
    serde_json::Value::Array(
        addrs
            .iter()
            .map(|addr| json!({ "email": addr.email, "name": addr.name }))
            .collect(),
    )
}

fn clean_subject(subject: &str) -> String {
    subject
        .trim()
        .trim_start_matches("Re:")
        .trim_start_matches("Fwd:")
        .trim()
        .to_string()
}

fn derive_thread_identifier(
    message_id: Option<&str>,
    in_reply_to: Option<&str>,
    subject: &str,
) -> String {
    if let Some(reply) = in_reply_to {
        reply.to_string()
    } else if let Some(id) = message_id {
        id.to_string()
    } else {
        format!("subject:{}", subject.to_lowercase())
    }
}

fn extract_bodies(
    parsed: &ParsedMail<'_>,
) -> (Option<String>, Option<String>, Vec<AttachmentPart>) {
    let mut text_body = None;
    let mut html_body = None;
    let mut attachments = Vec::new();
    walk_parts(parsed, &mut text_body, &mut html_body, &mut attachments);
    (text_body, html_body, attachments)
}

fn walk_parts(
    part: &ParsedMail<'_>,
    text_body: &mut Option<String>,
    html_body: &mut Option<String>,
    attachments: &mut Vec<AttachmentPart>,
) {
    if part.subparts.is_empty() {
        let mime = part.ctype.mimetype.to_lowercase();
        if mime == "text/plain" && text_body.is_none() {
            if let Ok(body) = part.get_body() {
                *text_body = Some(body);
            }
        } else if mime == "text/html" && html_body.is_none() {
            if let Ok(body) = part.get_body() {
                *html_body = Some(body);
            }
        } else {
            let data = part.get_body_raw().unwrap_or_default();
            let filename = part
                .get_content_disposition()
                .params
                .get("filename")
                .cloned()
                .unwrap_or_else(|| "attachment".to_string());
            let content_id = part
                .get_headers()
                .get_first_value("Content-ID")
                .map(|cid| cid.trim_matches('<').trim_matches('>').to_string());
            attachments.push(AttachmentPart {
                file_name: filename,
                content_type: part.ctype.mimetype.clone(),
                size_bytes: data.len() as i64,
                is_inline: part.get_content_disposition().disposition == DispositionType::Inline,
                content_id,
                data,
            });
        }
    } else {
        for sub in &part.subparts {
            walk_parts(sub, text_body, html_body, attachments);
        }
    }
}

fn truncate_preview(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.len() <= 200 {
        return trimmed.to_string();
    }
    trimmed.chars().take(200).collect::<String>()
}
