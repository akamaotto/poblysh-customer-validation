# Testing Your Customer Validation App

## ✅ Setup Complete!

Your application is now running:
- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:3000
- **Database**: PostgreSQL (local, database: validation)

---

## Quick Test Steps

### 1. Open the Application
Open your browser to: **http://localhost:3000**

You should see:
- A clean pipeline page with OKLCH colors
- "Add Startup" button in the top right
- Empty table (no startups yet)

### 2. Create Your First Startup
1. Click **"Add Startup"**
2. Fill in the form:
   - **Name**: Paystack
   - **Category**: Fintech
   - **Status**: Lead
   - **Website**: https://paystack.com
   - **Newsroom URL**: (leave blank or add one)
3. Click **"Create Startup"**
4. You should be redirected to `/startups` and see Paystack in the table

### 3. View Startup Details
1. Click on **"Paystack"** in the table
2. You should see:
   - Basic information section
   - Contacts section (empty)
   - Outreach Timeline section (empty)
   - Interviews section (empty)

### 4. Edit a Startup
1. On the detail page, click **"Edit"**
2. Change the **Status** to "Intro Secured"
3. Click **"Save Changes"**
4. Verify the status updated on the detail page

### 5. Create More Startups
Add a few more to see the pipeline in action:
- **Flutterwave** (Fintech, Lead)
- **Andela** (SaaS, Call Booked)
- **Kobo360** (SaaS, Interview Done)

---

## Test the API Directly

### Health Check
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","message":"Customer Validation API is running"}`

### List All Startups
```bash
curl http://localhost:3001/api/startups
```

### Create a Startup via API
```bash
curl -X POST http://localhost:3001/api/startups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flutterwave",
    "category": "Fintech",
    "status": "Lead",
    "website": "https://flutterwave.com"
  }'
```

### Create a Contact (API only for now)
```bash
# Replace STARTUP_ID with an actual ID from your database
curl -X POST http://localhost:3001/api/startups/STARTUP_ID/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "startup_id": "STARTUP_ID",
    "name": "John Doe",
    "role": "Founder",
    "email": "john@example.com",
    "is_primary": true
  }'
```

### Log Outreach (API only for now)
```bash
# Replace STARTUP_ID with an actual ID
curl -X POST http://localhost:3001/api/startups/STARTUP_ID/outreach \
  -H "Content-Type: application/json" \
  -d '{
    "startup_id": "STARTUP_ID",
    "channel": "Email",
    "direction": "Outbound",
    "outcome": "No Response",
    "message_summary": "Sent intro email to founder"
  }'
```

---

## What to Look For

### ✅ Working Features
- Pipeline table with all startups
- Status badges with colors
- Create new startups
- Edit existing startups
- View startup details
- Contacts display (if added via API)
- Outreach timeline (if added via API)

### 🔄 Coming Soon (API Ready)
- Contact forms in UI
- Outreach log forms in UI
- Interview management
- Weekly synthesis dashboard

---

## Troubleshooting

### Frontend shows "Failed to fetch startups"
- Check backend is running: `curl http://localhost:3001/health`
- Check browser console (F12) for errors
- Verify `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Backend won't start
- Check database connection: Try `psql -U akamaotto -d validation -c "SELECT 1;"`
- Verify `.env` has correct DATABASE_URL
- Check port 3001 is free: `lsof -i :3001`

### Database errors
- Verify migrations ran: `cd backend && sea-orm-cli migrate status`
- Check tables exist: `psql -U akamaotto -d validation -c "\dt"`

---

## Next Steps

1. **Add sample data** - Create 5-10 startups to see the pipeline
2. **Test contacts** - Use the API to add contacts, then view them on detail pages
3. **Test outreach** - Use the API to log outreach, see the timeline
4. **Customize** - Adjust colors in `frontend/app/globals.css`
5. **Extend** - Add interview forms, filters, etc.

---

## Stopping the Servers

When you're done testing:
- **Backend**: Press `Ctrl+C` in the terminal running `cargo run`
- **Frontend**: Press `Ctrl+C` in the terminal running `npm run dev`

The database will keep running (it's your local PostgreSQL instance).

---

## Database Access

To view your data directly:
```bash
# Connect to database
psql -U akamaotto -d validation

# View all startups
SELECT id, name, status, category FROM startup;

# View all contacts
SELECT name, role, email FROM contact;

# Exit
\q
```

Enjoy building your customer validation tracker! 🚀
