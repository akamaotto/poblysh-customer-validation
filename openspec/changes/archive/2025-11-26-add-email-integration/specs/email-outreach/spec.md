## ADDED Requirements

### Requirement: Email Sending
The system SHALL allow users to send emails to contacts directly from the contact profile using the Resend API.

#### Scenario: Send email from contact card
- **WHEN** user clicks "Send Email" on a contact with email address
- **THEN** display email compose modal with contact email pre-filled
- **WHEN** user composes message and clicks send
- **THEN** send email via Resend API and create OutreachLog entry

#### Scenario: Email with template
- **WHEN** user selects email template (intro, follow-up)
- **THEN** pre-populate subject and body with template content
- **WHEN** user customizes and sends
- **THEN** track as sent email with template reference

### Requirement: Email Tracking Integration
The system SHALL automatically track all sent emails in the OutreachLog with delivery status and message details.

#### Scenario: Automatic email logging
- **WHEN** email is sent via Resend API
- **THEN** create OutreachLog entry with channel="email", direction="outbound"
- **AND** store Resend message_id, subject, and delivery status

#### Scenario: Delivery status updates
- **WHEN** Resend webhook reports delivery status change
- **THEN** update corresponding OutreachLog entry delivery_status
- **AND** track status progression (sent → delivered → opened)

### Requirement: Email Outreach UI
The system SHALL provide user interface for composing and sending emails with basic template support.

#### Scenario: Email compose modal
- **WHEN** user opens email compose
- **THEN** display form with recipient, subject, body, and template selection
- **AND** validate email format before sending
- **AND** show loading state during send operation

#### Scenario: Outreach log email entries
- **WHEN** viewing OutreachLog with email entries
- **THEN** display email icon, subject line, and delivery status
- **AND** show "View Email" action for sent messages