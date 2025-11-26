# Change: Email Integration with Resend API

## Why
Customer validation teams need to send outreach emails directly from the app and automatically track all email communications alongside other outreach activities. Currently, users must leave the app to send emails and manually log them, creating workflow friction and potential data gaps.

## What Changes
- Integrate Resend API for sending transactional emails from contact profiles
- Extend OutreachLog entity with email-specific fields (message_id, subject, delivery_status)  
- Add email compose UI in contact cards with basic templates
- Create API endpoints for sending individual emails and tracking delivery status
- Automatically create OutreachLog entries for all sent emails

## Impact
- Affected specs: email-outreach (new capability)
- Affected code: backend/main.rs, entities/outreach_log.rs, frontend API client, contact UI components, OutreachLog views