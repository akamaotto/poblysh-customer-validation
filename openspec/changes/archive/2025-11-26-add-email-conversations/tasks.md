## 1. Backend foundation
- [x] 1.1 Extend migrations/entities for `email_credentials`, `conversations`, and `messages` with startup linkage, provider metadata, attachment tables, read/archive flags, and per-user sync checkpoints.
- [x] 1.2 Add admin + per-user credential flows (IMAP/SMTP defaults, credential tests, encryption service integration, audit logging).
- [x] 1.3 Implement background IMAP sync + SMTP send append (UID tracking, delta fetch, error propagation, retry policy).

## 2. Conversations API
- [x] 2.1 Build list/detail/search endpoints with filters (startup, unread, participants) plus pagination and Result/Option-based error handling.
- [x] 2.2 Add actions for mark read/unread, archive/unarchive, reply/forward with attachment upload/download, and expose sync/credential status endpoints.

## 3. Frontend experience
- [x] 3.1 Create admin email settings + per-user onboarding UI with connection tests and status messaging.
- [x] 3.2 Implement inbox list (filters, search, startup chips, read/archive controls) and conversation view (threading, attachments, reply/forward composer).
- [x] 3.3 Surface sync indicators, credential errors, and optimistic updates aligned with Result/Option patterns.

## 4. Readiness
- [x] 4.1 Update documentation (conversations.md, runbooks) and validate `openspec/changes/add-email-conversations` via `openspec validate add-email-conversations --strict`.
