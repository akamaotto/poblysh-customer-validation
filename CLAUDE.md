<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Customer Validation App for Poblysh - a full-stack web application for tracking customer validation operations. The app helps manage startups through the validation pipeline from initial lead to activation candidate.

## Tech Stack

- **Backend**: Rust with Axum web framework
- **Frontend**: Next.js 16 with TypeScript, React 19, and Tailwind CSS v4
- **Database**: PostgreSQL with SeaORM
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS with OKLCH color scheme

## Common Development Commands

### Backend Development
```bash
# Start backend (from backend directory)
cd backend
cargo run

# Run database migrations
sea-orm-cli migrate up

# Check migration status
sea-orm-cli migrate status

# Build for production
cargo build --release
```

### Frontend Development
```bash
# Start frontend (from frontend directory)
cd frontend
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Operations
```bash
# Ensure PostgreSQL is running locally (example for Homebrew users)
brew services start postgresql@15

# Create database + user (first time)
createdb validation
psql postgres -c "CREATE USER validation WITH PASSWORD 'validation';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE validation TO validation;"

# Connect to database directly
psql -U validation -d validation -h localhost -p 5432
```

## Architecture

### Backend Structure
- **`backend/src/main.rs`**: Main application entry point with all API routes
- **`backend/src/entities/`**: SeaORM entity models (startup, contact, outreach_log, interview, interview_insight, weekly_synthesis)
- **`backend/migration/`**: Database migration files
- **Single-file architecture**: All handlers and routes are in `main.rs` for simplicity

### Frontend Structure
- **`frontend/app/`**: Next.js App Router pages
- **`frontend/lib/`**: API client, React hooks, and utilities
- **`components/`**: Reusable React components
- **App Router**: Uses Next.js 13+ App Router with TypeScript

### Database Schema
Core entities with relationships:
- **Startup**: Main entity with validation status
- **Contact**: People at startups (many-to-one with Startup)
- **OutreachLog**: Communication history (many-to-one with Startup)
- **Interview**: Interview records (many-to-one with Startup)
- **InterviewInsight**: Structured interview insights with JTBD framework
- **WeeklySynthesis**: Weekly aggregated insights

## Key Features

### Pipeline Management
- Kanban board with drag-and-drop status updates
- Table view for detailed data inspection
- Statuses: Lead → Contacted → Intro Secured → Call Booked → Meeting Scheduled → Interview Done → In Discussion → Activation Candidate → Closed Won/Lost

### Data Flow
- Frontend uses TanStack Query for server state management
- API follows RESTful patterns
- Real-time updates through query invalidation
- Optimistic UI updates where appropriate

### UI/UX Patterns
- OKLCH color scheme for modern, accessible design
- Keyboard-friendly interfaces
- Minimalist design focused on data and workflows
- Animated transitions and hover states

## Development Workflow

### Adding New Features
1. **Backend**: Add new handlers to `main.rs` following existing patterns
2. **Frontend**: Add API methods to `lib/api.ts` and React hooks to `lib/hooks.ts`
3. **Pages**: Create new routes in `app/` directory following App Router conventions

### Database Changes
1. Create new migration: `sea-orm-cli migrate generate <name>`
2. Update entity models in `src/entities/`
3. Run migration: `sea-orm-cli migrate up`

### Testing API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# List startups
curl http://localhost:3001/api/startups

# Create startup
curl -X POST http://localhost:3001/api/startups \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Startup","category":"Fintech","status":"Lead"}'
```

## Environment Configuration

### Backend (.env)
```bash
DATABASE_URL=postgresql://validation:validation@localhost:5432/validation
RUST_LOG=info
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Important Notes

- **No tests required** - As per project specifications
- **CORS enabled** for local development between frontend:3000 and backend:3001
- **Local PostgreSQL** with predefined credentials for local development
- **SeaORM CLI** required for database operations
- **Single binary backend** - all routes in one file for simplicity

## Validation Pipeline Statuses

The app tracks startups through these stages:
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

## Common Patterns

### React Query Usage
```typescript
// Custom hooks follow pattern: use<Entity> and useCreate<Entity>
const { data, isLoading, error } = useStartups();
const createMutation = useCreateStartup();
```

### API Response Patterns
- All endpoints return JSON
- Error responses have appropriate HTTP status codes
- Success responses return the created/updated entity
- List endpoints return arrays of entities

### Styling Patterns
- Use Tailwind classes with OKLCH colors
- Consistent spacing and typography
- Hover states and transitions for better UX
- Responsive design with mobile-first approach
