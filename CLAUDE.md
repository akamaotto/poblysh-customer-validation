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
- **Type Safety**: `oxide.ts` for Result and Option types (Rust-inspired patterns)

## Type Safety System

This project uses **strict type safety** with Rust-inspired patterns via `oxide.ts`.

### Core Type-Safe Patterns

#### Result Types for Fallible Operations
Use `Result<T, E>` for operations that can fail (API calls, validation, parsing):

```typescript
import { match } from 'oxide.ts';
import { apiWithResults } from '@/lib/api-with-results';

// API calls return Result<Data, FetchError>
const result = await apiWithResults.getStartups();

match(result, {
  Ok: (startups) => {
    console.log('Success:', startups);
    setStartups(startups);
  },
  Err: (error) => {
    // Type-safe error handling
    if (error.type === 'HTTP_ERROR' && error.status === 401) {
      redirectToLogin();
    } else if (error.type === 'NETWORK_ERROR') {
      showOfflineMessage();
    } else {
      showError(formatFetchError(error));
    }
  },
});
```

#### Option Types for Nullable Values
Use `Option<T>` for nullable/optional data instead of `null` or `undefined`:

```typescript
import { match } from 'oxide.ts';
import { fromNullable } from '@/lib/result-utils';

// Convert nullable to Option
const website = fromNullable(startup.website);

// Pattern match for exhaustive handling
match(website, {
  Some: (url) => <a href={url}>{url}</a>,
  None: () => <span className="text-gray-400">No website</span>,
});

// Or use map/unwrapOr for transformations
const displayDate = fromNullable(startup.last_contact_date)
  .map(date => new Date(date).toLocaleDateString())
  .unwrapOr('Never');
```

#### Form Validation with Result Types
Validation returns `ValidationResult<T>` which is `Result<T, ValidationError[]>`:

```typescript
import { match } from 'oxide.ts';
import { validateStartupForm } from '@/lib/validation';

const handleSubmit = async (formData) => {
  const validationResult = validateStartupForm(formData);

  match(validationResult, {
    Ok: async (validData) => {
      // Data is validated and typed
      const createResult = await apiWithResults.createStartup(validData);
      
      match(createResult, {
        Ok: (startup) => {
          console.log('Created:', startup);
          router.push(`/startups/${startup.id}`);
        },
        Err: (error) => showError(formatFetchError(error)),
      });
    },
    Err: async (errors) => {
      // IMPORTANT: Both branches must return same type
      // If Ok is async, Err must be async too
      const errorMap = {};
      errors.forEach(err => errorMap[err.field] = err.message);
      setFieldErrors(errorMap);
    },
  });
};
```

### Banned Unsafe Patterns

**❌ NEVER use these in the codebase:**

```typescript
// ❌ DON'T: Using 'any' type
const data: any = await fetchData();

// ✅ DO: Use specific types or Result
const result = await safeFetch<Startup[]>('/api/startups');

// ❌ DON'T: Non-null assertion
const value = data.field!;

// ✅ DO: Use Option type
const value = fromNullable(data.field);

// ❌ DON'T: try-catch for expected errors
try {
  const res = await fetch('/api/startups');
  const data = await res.json();
} catch (error) {
  console.error(error);
}

// ✅ DO: Use Result type
const result = await safeFetch<Startup[]>('/api/startups');
match(result, {
  Ok: (data) => handleSuccess(data),
  Err: (error) => handleError(error),
});

// ❌ DON'T: @ts-ignore or @ts-expect-error
// @ts-ignore
const broken = somethingWrong();

// ✅ DO: Fix the underlying type issue
```

### Important Type Rules

1. **Match Branch Consistency**: All branches in `match()` must return the same type
   - If `Ok` branch is async, `Err` branch must be async too
   - If `Some` returns JSX, `None` must return JSX too

2. **No Implicit Any**: TypeScript strict mode is enabled - all types must be explicit

3. **Exhaustive Matching**: All cases must be handled (Ok/Err, Some/None)

4. **Typed Errors**: Use specific error types (`FetchError`, `ValidationError[]`)

### Available Utilities

**`@/lib/result-utils.ts`:**
- `safeFetch<T>(url, options)` - Type-safe fetch returning `Result<T, FetchError>`
- `fromNullable<T>(value)` - Convert nullable to `Option<T>`
- `validateEmail(email)` - Returns `Result<string, string>`
- `validateRequired(value, fieldName)` - Returns `Result<T, string>`
- `validateUrl(url)` - Returns `Result<string, string>`
- `formatFetchError(error)` - User-friendly error messages

**`@/lib/validation.ts`:**
- `validateStartupForm(data)` - Returns `ValidationResult<ValidatedData>`
- `validateContactForm(data)` - Returns `ValidationResult<ValidatedData>`
- `validateInterviewForm(data)` - Returns `ValidationResult<ValidatedData>`
- `getFieldError(errors, field)` - Extract specific field error
- `hasFieldError(errors, field)` - Check if field has error

**`@/lib/api-with-results.ts`:**
- All API methods return `Result<Data, FetchError>`
- Type-safe wrappers around the base API client
- Automatic error handling and type conversion


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
