## 1. Backend Implementation
- [x] 1.1 Add Resend dependency to Cargo.toml
- [x] 1.2 Create email service module in main.rs
- [x] 1.3 Add RESEND_API_KEY to environment configuration
- [x] 1.4 Extend OutreachLog entity with email-specific fields (message_id, subject, delivery_status)
- [x] 1.5 Create database migration for new OutreachLog fields
- [x] 1.6 Implement POST /api/startups/{id}/contacts/{contact_id}/send-email endpoint
- [x] 1.7 Implement GET /api/email-status/{message_id} endpoint for delivery tracking
- [x] 1.8 Add email templates (intro, follow-up, custom)

## 2. Frontend Implementation  
- [x] 2.1 Add email API methods to lib/api.ts
- [x] 2.2 Create EmailCompose component with rich text editor
- [x] 2.3 Add "Send Email" button to Contact cards
- [x] 2.4 Implement template selection dropdown
- [x] 2.5 Add email status indicators to OutreachLog views
- [x] 2.6 Update contact form to validate email addresses

## 3. Integration & Polish
- [x] 3.1 Test email delivery and logging
- [x] 3.2 Add error handling for failed sends
- [x] 3.3 Update OutreachLog filtering to include email channel
- [x] 3.4 Add loading states and success/error feedback
- [x] 3.5 Update project documentation with Resend setup instructions
