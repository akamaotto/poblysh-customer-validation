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

## API Endpoints

### Startups
- `GET /api/startups` - List all startups
- `GET /api/startups/:id` - Get startup by ID
- `POST /api/startups` - Create new startup
- `PUT /api/startups/:id` - Update startup
- `DELETE /api/startups/:id` - Delete startup

### Contacts
- `GET /api/startups/:startup_id/contacts` - List contacts for a startup
- `POST /api/startups/:startup_id/contacts` - Create new contact
- `DELETE /api/contacts/:id` - Delete contact

### Outreach Logs
- `GET /api/startups/:startup_id/outreach` - List outreach logs for a startup
- `POST /api/startups/:startup_id/outreach` - Create new outreach log

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
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
