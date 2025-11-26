# Poblysh Customer Validation App

A comprehensive full-stack web application for tracking customer validation operations and managing startup pipelines through the validation journey. Built for Poblysh to streamline the process of taking startups from initial leads to activation candidates.

## Tech Stack

- **Backend**: Rust + Axum
- **Frontend**: Next.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: SeaORM
- **Styling**: Tailwind CSS (OKLCH color scheme)
- **State Management**: TanStack Query (React Query)

## Project Structure

```
validation/
├── backend/          # Rust/Axum API server
│   ├── src/
│   │   ├── entities/ # SeaORM entity models
│   │   └── main.rs   # API routes and server
│   └── migration/    # Database migrations
├── frontend/         # Next.js application
│   ├── app/          # App router pages
│   ├── components/   # React components
│   └── lib/          # API client and hooks
└── (local PostgreSQL instance) # bring your own database
```

## Getting Started

### Prerequisites

- Rust (latest stable)
- Node.js 18+
- sea-orm-cli: `cargo install sea-orm-cli`
- Local PostgreSQL 14+ instance (createdb + user with access)

### Setup

1. **Create the database (if needed)**:
   ```bash
   createdb validation
   psql postgres -c "CREATE USER validation WITH PASSWORD 'validation';"
   psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE validation TO validation;"
   ```
   Ensure PostgreSQL is running locally and accessible at `postgresql://validation:validation@localhost:5432/validation`.

2. **Run database migrations**:
   ```bash
   cd backend
   sea-orm-cli migrate up
   ```

3. **Start the backend**:
   ```bash
   cd backend
   cargo run
   ```
   Backend runs on `http://localhost:3001`

4. **Start the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

### Email Integration Setup (Resend)

1. Create a [Resend](https://resend.com) account and generate an API key with email send permissions.
2. Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_FROM_NAME` to `backend/.env`. The `RESEND_FROM_EMAIL` address must be verified in your Resend dashboard.
3. During runtime each sent email is addressed `From` the currently logged-in Poblysh user (name + email), with the `RESEND_FROM_*` values acting only as fallbacks. Make sure every teammate signs in with their `@poblysh.com` account.
4. Restart the backend after updating environment variables so the new credentials are loaded.
5. Optional: set `FRONTEND_URL` in `backend/.env` if you want password reset and outreach emails to link to a non-localhost frontend.

## API Endpoints

### Startups
- `GET /api/startups` - List all startups
- `GET /api/startups/:id` - Get startup by ID
- `POST /api/startups` - Create new startup
- `PUT /api/startups/:id` - Update startup
- `DELETE /api/startups/:id` - Delete startup

### Contacts
- `GET /api/contacts[?trashed=true]` - List all contacts (admins can request trashed contacts)
- `GET /api/startups/:startup_id/contacts[?trashed=true]` - List contacts for a startup (admins can include trashed)
- `POST /api/startups/:startup_id/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact details
- `DELETE /api/contacts/:id` - Move a contact to trash (owner or admin)
- `POST /api/admin/contacts/:id/restore` - Restore a trashed contact (admin)
- `DELETE /api/admin/contacts/:id/permanent` - Permanently delete a trashed contact (admin)
- `POST /api/admin/contacts/restore` - Bulk restore trashed contacts
- `POST /api/admin/contacts/delete-forever` - Bulk delete trashed contacts

### Outreach Logs
- `GET /api/startups/:startup_id/outreach` - List outreach logs for a startup
- `POST /api/startups/:startup_id/outreach` - Create new outreach log

### Email Outreach
- `POST /api/startups/:startup_id/contacts/:contact_id/send-email` - Send an email via Resend and log it automatically
- `GET /api/email-status/:message_id` - Refresh delivery status for a previously sent email

### Health Check
- `GET /health` - API health check

## Validation Pipeline

The app tracks startups through these validation stages:
1. **Lead** - Initial prospect
2. **Contacted** - Made initial contact
3. **Intro Secured** - Got introduction
4. **Call Booked** - Meeting scheduled
5. **Meeting Scheduled** - Meeting confirmed
6. **Interview Done** - Interview completed
7. **In Discussion** - Active conversations
8. **Activation Candidate** - Ready for onboarding
9. **Closed Won** - Successfully onboarded
10. **Closed Lost** - Not proceeding
11. **Not a Fit** - Not suitable

## Pages

### Frontend Routes
- `/` - Redirects to `/startups`
- `/startups` - Pipeline kanban board and table view
- `/startups/new` - Create new startup form
- `/startups/[id]` - Startup detail page (with contacts, outreach, and interviews)
- `/startups/[id]/edit` - Edit startup form

### Key Features
- **Kanban Board**: Drag-and-drop interface for pipeline management
- **Table View**: Detailed data inspection with filtering and sorting
- **Interview Insights**: JTBD framework integration for structured customer interviews
- **Weekly Synthesis**: Automated aggregation of validation insights
- **Real-time Updates**: TanStack Query for optimistic UI updates

### Contact Detail Sheet & Trash Workflow
- Every contact row now includes a **View** action that opens a left-aligned sheet showing all stored fields with owner metadata, keeping the startup view visible in the background.
- The sheet pins **Trash**, **Edit**, and **Email** buttons to the footer. Email reuses the existing compose modal, Edit reuses the contact form, and Trash is limited to the contact owner or admins.
- Trashing a contact flips a soft-delete `is_trashed` flag, hides it from default lists, and surfaces a confirmation notice inside the sheet.
- Admins can switch the startup contacts section into a **Trashed** tab to review, restore, or permanently delete contacts individually or in bulk via dedicated admin endpoints.

## Database Schema

### Core Entities
- **Startup**: Company information and validation status
- **Contact**: People at each startup
- **OutreachLog**: Communication history
- **Interview**: Interview records
- **InterviewInsight**: Structured interview notes with JTBD
- **WeeklySynthesis**: Weekly aggregated insights

## Development Notes

- No tests required (as per project spec)
- OKLCH color scheme for modern, accessible design
- Minimalist UI focused on keyboard-friendly tables and forms
- CORS enabled for local development

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://validation:validation@localhost:5432/validation
RUST_LOG=info
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Poblysh
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
