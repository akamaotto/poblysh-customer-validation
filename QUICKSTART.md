# Quick Start Guide - Customer Validation App

## Prerequisites Check

Before starting, verify you have:
- ✅ Rust (check: `rustc --version`)
- ✅ Node.js 18+ (check: `node --version`)
- ✅ sea-orm-cli (check: `sea-orm-cli --version`)
- ✅ PostgreSQL 14+ (local install like Homebrew/Postgres.app or a managed instance)

## Option 1: Local PostgreSQL (Recommended)

If you run PostgreSQL on your machine (Homebrew/Postgres.app/etc.):

### 1. Start PostgreSQL
Make sure the local service is running (for Homebrew users: `brew services start postgresql@15`). Verify with:
```bash
pg_isready
```

### 2. Create Database + User (first-time setup)
```bash
createdb validation
psql postgres -c "CREATE USER validation WITH PASSWORD 'validation';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE validation TO validation;"
```

### 3. Run Database Migrations
```bash
cd backend
sea-orm-cli migrate up
```

### 4. Start Backend
```bash
# In backend directory
cargo run
```
Backend will run on `http://localhost:3001`

### 5. Start Frontend (New Terminal)
```bash
cd /Users/akamaotto/code/validation/frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

### 6. Test the Application
Open your browser to `http://localhost:3000` and you should see:
- Pipeline page (empty initially)
- "Add Startup" button
- Clean UI with OKLCH colors

---

## Option 2: Managed PostgreSQL (Cloud)

If you prefer a hosted PostgreSQL instance:

### 1. Get Free PostgreSQL Database
Choose one:
- **Neon** (https://neon.tech) - Free tier, instant setup
- **Supabase** (https://supabase.com) - Free tier with dashboard
- **ElephantSQL** (https://www.elephantsql.com) - Free tier

### 2. Update Database URL
After creating your database, update `backend/.env`:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
RUST_LOG=info
```

### 3. Run Migrations
```bash
cd /Users/akamaotto/code/validation/backend
sea-orm-cli migrate up
```

### 4. Start Backend & Frontend
Same as Option 1, steps 4-6.

---

## Option 3: Quick Local Test (SQLite - Development Only)

For quick testing without PostgreSQL:

### 1. Modify Backend for SQLite
Update `backend/Cargo.toml`, change the sea-orm line:
```toml
sea-orm = { version = "1.1", features = ["sqlx-sqlite", "runtime-tokio-native-tls", "macros"] }
```

Update `backend/.env`:
```bash
DATABASE_URL=sqlite://validation.db?mode=rwc
RUST_LOG=info
```

### 2. Run Everything
```bash
cd backend
sea-orm-cli migrate up
cargo run

# New terminal
cd ../frontend
npm run dev
```

---

## Testing the Features

Once running, test these workflows:

### 1. Create a Startup
1. Go to `http://localhost:3000`
2. Click "Add Startup"
3. Fill in:
   - Name: "Paystack"
   - Category: "Fintech"
   - Status: "Lead"
   - Website: "https://paystack.com"
4. Click "Create Startup"
5. You should see it in the pipeline

### 2. View Startup Details
1. Click on the startup name in the table
2. You should see the detail page with sections for:
   - Basic Information
   - Contacts (empty)
   - Outreach Timeline (empty)
   - Interviews (empty)

### 3. Edit a Startup
1. On the detail page, click "Edit"
2. Change the status to "Intro Secured"
3. Click "Save Changes"
4. Verify the status updated

### 4. Test API Directly
You can also test the API with curl:

```bash
# Health check
curl http://localhost:3001/health

# List startups
curl http://localhost:3001/api/startups

# Create a startup
curl -X POST http://localhost:3001/api/startups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flutterwave",
    "category": "Fintech",
    "status": "Lead",
    "website": "https://flutterwave.com"
  }'
```

---

## Troubleshooting

### Backend won't start
- Check database connection: `DATABASE_URL` in `.env`
- Verify migrations ran: `sea-orm-cli migrate status`
- Check port 3001 is free: `lsof -i :3001`

### Frontend won't start
- Verify backend is running first
- Check `frontend/.env.local` has correct API URL
- Try: `rm -rf .next && npm run dev`

### Database connection failed
- Local setup: ensure PostgreSQL service is running (`pg_isready`) and the `validation` user/database exist
- Cloud setup: test the connection string with `psql` or a DB client

---

## Next Steps After Testing

Once you verify everything works:

1. **Add sample data** - Create a few startups to see the pipeline
2. **Test contacts** - Use the API to add contacts (UI forms coming next)
3. **Test outreach logs** - Use the API to log outreach activities
4. **Customize** - Adjust colors, add fields, etc.

## Need Help?

- Backend logs: Check the terminal running `cargo run`
- Frontend logs: Check browser console (F12)
- Database: Use a tool like TablePlus, pgAdmin, or Supabase dashboard
