# email-conversations Specification

## Purpose
TBD - created by archiving change add-email-conversations. Update Purpose after archive.
## Requirements
### Requirement: Email Account Connection & Status
The system SHALL let admins define default IMAP/SMTP settings per domain and allow each user to store encrypted credentials, test connectivity, and view sync status before accessing the inbox.

#### Scenario: User connects IMAP account
- **WHEN** a user opens Email Integration and submits work email + password/app-password
- **THEN** the backend SHALL encrypt the secret, test IMAP+SMTP connectivity, and persist host/port/provider defaults
- **AND** the user SHALL see a success state with last-sync timestamp initialized

#### Scenario: Failed credential test surfaces actionable error
- **WHEN** IMAP or SMTP login fails during setup or a scheduled sync
- **THEN** the system SHALL record `email_sync_status = "error"` plus the provider message and expose it via `GET /api/user/email-status`
- **AND** the frontend SHALL display the error with guidance to retry or reauthenticate

### Requirement: Conversation Synchronization & Storage
The system SHALL continuously ingest inbound/outbound email via IMAP/SMTP, grouping messages into conversations per user, tracking provider metadata, and linking to startups when contacts match.

#### Scenario: New inbound email syncs into a conversation
- **WHEN** a new message arrives in the user’s mailbox
- **THEN** the sync worker SHALL fetch it using incremental UIDs, parse headers/body/attachments, and either update an existing conversation (tracking latest message time, unread count, message count) or create a new one linked to the matching startup/contact
- **AND** the message SHALL store RFC Message-ID, In-Reply-To, participants (to/cc/bcc), direction="received", read flags, and attachment metadata

#### Scenario: Sync failure retries and records progress
- **WHEN** the IMAP session drops mid-sync
- **THEN** the worker SHALL retry with exponential backoff, keep the last successful UID checkpoint, and surface the failure in the user’s sync status without duplicating already-processed messages

### Requirement: Inbox Browsing & Search
The system SHALL provide an inbox API/UI that lists conversations with pagination, filters (startup, unread, participant, has attachment, assigned user), admin “show all” toggle, and full-text search on subject/body snippets.

#### Scenario: User filters conversations by startup and unread state
- **WHEN** a user selects a startup chip and toggles “Unread only”
- **THEN** `GET /api/conversations` SHALL return only matching conversations sorted by latest message date, including counts and snippets, and the UI SHALL update the list + empty-state accordingly

#### Scenario: Admin views all team conversations
- **WHEN** an admin enables “Show all conversations”
- **THEN** the API SHALL include every team member’s conversations with owner metadata, respecting participant privacy, and the UI SHALL badge the owner on each row

### Requirement: Conversation Detail & Actions
The system SHALL render a full thread view with message metadata, attachment previews/downloads, startup context, and allow reply/forward actions using the user’s SMTP credentials while keeping state in sync.

#### Scenario: User replies from Poblysh
- **WHEN** the user composes a reply inside a conversation and clicks Send
- **THEN** the system SHALL send via SMTP (respecting participants + attachments), optimistically append the message to the thread, update read/unread + snippet, and enqueue IMAP append/sync so the Sent folder copy is tracked

#### Scenario: Attachment view/download
- **WHEN** a message has attachments
- **THEN** the UI SHALL list filenames + sizes, allow download via signed URLs, and the backend SHALL stream the stored blob after permission checks

