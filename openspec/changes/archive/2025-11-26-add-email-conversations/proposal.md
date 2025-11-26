# Change: Add Email Conversations Inbox

## Why
Teams currently send outbound emails from Poblysh but cannot see inbound replies, threaded context, or startup-linked conversations. Early IMAP code in the repo syncs plain text messages per user but lacks schema, UX, and security guarantees needed for daily work. We need a first-class email inbox so researchers can stay inside Poblysh while collaborating on outreach.

## What Changes
- Stand up resilient per-user email connections with encrypted credential storage, sync status, admin-configurable defaults, and background syncing via IMAP/SMTP.
- Persist conversations/messages with provider metadata (thread IDs, UIDs, participants, attachments, startup linkage, read/archive flags) plus APIs for listing, filtering, replying, and marking state.
- Ship a conversations UI: credential onboarding, inbox list with filters/search/startup chips, conversation detail with threaded view, reply/forward, attachment previews, and sync cues.
- Add error handling, monitoring, and explicit user feedback (sync states, credential errors) across backend + frontend so failures are actionable.

## Impact
- Affected specs: `email-conversations`
- Affected code: `backend/src/conversations_controller.rs`, `backend/src/services/*`, `backend/src/entities/*`, `backend/migration`, `frontend/app/conversations`, `frontend/components/mail`, `frontend/lib/api.ts`
