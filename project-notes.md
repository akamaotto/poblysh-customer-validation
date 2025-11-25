# Project Notes: Customer Validation App

## 1. Context
**Poblysh** is a PR/visibility tool for African startups. We manually created draft newsrooms for 50 Nigerian startups. Now we’re doing customer validation, not sales.

**Our Process:**
1.  Email/DM any team member → ask them to CC comms/marketing/social.
2.  Talk to comms/marketing/founders on 15-min calls.
3.  Show them their pre-created newsroom.
4.  Ask about their PR workflow, pains, and goals.
5.  Log everything.
6.  Use these conversations to decide what Poblysh should become.

**Goal:** Build a full-stack web app to track and run this "Customer Validation Operation" in a structured way.

## 2. Tech Stack
*   **Backend:** Rust + Axum
*   **Frontend:** Next.js + TypeScript
*   **Database:** Postgres
*   **ORM:** SeaORM
*   **Auth:** BetterAuth (Next.js) + Compatible Axum Auth (Multi-user support required)
*   **Styling:** Tailwind CSS (Vanilla CSS variables with OKLCH)
*   **Testing:** **NONE**. Do not write any unit or integration tests. Keep it simple.

## 3. Core Objectives
The app should let us:
*   Manage a pipeline of startups for validation.
*   Track outreach (email, WhatsApp, LinkedIn).
*   Track intros to comms/marketing/social/founders.
*   Book and log interviews.
*   Capture structured interview notes + JTBD (Jobs to be Done).
*   Tag pains, desired outcomes, objections, and signal strength.
*   See a weekly synthesis of insights and patterns.
*   Mark "activation candidates" (startups we should onboard into Poblysh).

**We DO NOT need:**
*   Automated outreach sending.
*   Fancy billing.
*   Public-facing marketing pages.

**We DO need:**
*   Fast internal CRM-style tool for qualitative research.
*   Clean, minimal UI.
*   Keyboard-friendly tables/forms.

## 4. Data Model
Design a relational schema with these core entities:

### Startup
*   `id`
*   `name`
*   `category` (Fintech, SaaS, AI, etc.)
*   `website`
*   `newsroomUrl`
*   `status` (Lead, Intro Secured, Call Booked, Interview Done, Activation Candidate, Not a Fit)
*   `lastContactDate`
*   `nextStep` (Send Intro Request, Book Call, Follow-Up, Synthesize, Archive)
*   `adminClaimed` (boolean)
*   `createdAt`, `updatedAt`

### Contact
*   `id`
*   `startupId` (FK → Startup)
*   `name`
*   `role` (Founder, Comms, Marketing, Social, Ops, Other)
*   `email`
*   `phone`
*   `linkedinUrl`
*   `isPrimary` (boolean)
*   `notes`

### OutreachLog
*   `id`
*   `startupId` (FK)
*   `contactId` (FK)
*   `channel` (Email, WhatsApp, LinkedIn, Call, Other)
*   `direction` (Outbound, Inbound)
*   `messageSummary`
*   `date`
*   `outcome` (No Response, Replied, Intro Made, Call Booked, Declined)

### Interview
*   `id`
*   `startupId` (FK)
*   `contactId` (FK)
*   `date`
*   `type` (Discovery, Demo, Follow-Up)
*   `recordingUrl` (optional)
*   `transcriptUrl` (optional)
*   `summary` (short free text)

### InterviewInsight (linked to an Interview)
*   `id`
*   `interviewId` (FK)
*   `currentWorkflow` (text)
*   `biggestPains` (array/tags)
*   `desiredOutcomes` (array/tags)
*   `jtbdFunctional` (text)
*   `jtbdSocial` (text)
*   `jtbdEmotional` (text)
*   `excitedFeatures` (array/tags: Newsroom, AI stories, Blogger pitching, Mentions collection, etc.)
*   `ignoredFeatures` (array/tags)
*   `mainObjections` (array/tags: No time, Not my job, Founder doesn’t care, etc.)
*   `interestLevel` (High, Medium, Low, Negative)
*   `realOwnerRole` (Comms, Social, Founder, Marketing, Ops, None)
*   `willingToUseMonthly` (Yes, Maybe, No)
*   `activationCandidate` (boolean)

### WeeklySynthesis
*   `id`
*   `weekStartDate`
*   `weekEndDate`
*   `topPains` (text)
*   `topDesiredOutcomes` (text)
*   `topFeatures` (text)
*   `topObjections` (text)
*   `ownerPersonaSummary` (text)
*   `activationSummary` (text)
*   `productImplications` (text)

## 5. Core Screens / Pages

### 1. Pipeline View
*   Table of startups.
*   Columns: Name, Status, Category, Main Contact, Last Contact, Next Step, Interest Level, Admin Claimed.
*   Filters by: Status, Category, Interest Level.
*   Clicking a startup opens the Startup Detail Page.

### 2. Startup Detail Page
*   Basic info (name, site, newsroom URL, status, category).
*   List of contacts.
*   Timeline of Outreach Logs.
*   List of Interviews for that startup.
*   Quick actions: "Add Outreach", "Book Interview", "Add Interview Notes", "Mark Activation Candidate".

### 3. Interview Capture Page
*   Form to create or edit an Interview.
*   Embedded sections for: Current PR workflow, Pains, Desired outcomes, JTBD, Excited/ignored features, Objections, Interest level, Activation candidate checkbox.

### 4. Weekly Insights Page
*   Select a week (or auto group by week).
*   Show aggregated: Top pains, Top desired outcomes, Top objections, Distribution of interest level, Distribution of owner persona, List of activation candidates.
*   Area for manual text notes.

### 5. Outreach Log Page (or popup)
*   Fields: startup, contact, channel, date, messageSummary, outcome.

## 6. Design System & Theme
Use the following OKLCH color scheme and Tailwind configuration. Keep the design **minimalist**.

**CSS Variables:**
```css
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.2686 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.2686 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2686 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.9670 0.0029 264.5419);
  --secondary-foreground: oklch(0.4461 0.0263 256.8018);
  --muted: oklch(0.9846 0.0017 247.8389);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.9869 0.0214 95.2774);
  --accent-foreground: oklch(0.4732 0.1247 46.2007);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9276 0.0058 264.5313);
  --input: oklch(0.9276 0.0058 264.5313);
  --ring: oklch(0.7686 0.1647 70.0804);
  --chart-1: oklch(0.7686 0.1647 70.0804);
  --chart-2: oklch(0.6658 0.1574 58.3183);
  --chart-3: oklch(0.5553 0.1455 48.9975);
  --chart-4: oklch(0.4732 0.1247 46.2007);
  --chart-5: oklch(0.4137 0.1054 45.9038);
  --sidebar: oklch(0.9846 0.0017 247.8389);
  --sidebar-foreground: oklch(0.2686 0 0);
  --sidebar-primary: oklch(0.7686 0.1647 70.0804);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9869 0.0214 95.2774);
  --sidebar-accent-foreground: oklch(0.4732 0.1247 46.2007);
  --sidebar-border: oklch(0.9276 0.0058 264.5313);
  --sidebar-ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: -1px;
  --shadow-opacity: 0.1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2046 0 0);
  --foreground: oklch(0.9219 0 0);
  --card: oklch(0.2686 0 0);
  --card-foreground: oklch(0.9219 0 0);
  --popover: oklch(0.2686 0 0);
  --popover-foreground: oklch(0.9219 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.2686 0 0);
  --secondary-foreground: oklch(0.9219 0 0);
  --muted: oklch(0.2393 0 0);
  --muted-foreground: oklch(0.7155 0 0);
  --accent: oklch(0.4732 0.1247 46.2007);
  --accent-foreground: oklch(0.9243 0.1151 95.7459);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3715 0 0);
  --input: oklch(0.3715 0 0);
  --ring: oklch(0.7686 0.1647 70.0804);
  --chart-1: oklch(0.8369 0.1644 84.4286);
  --chart-2: oklch(0.6658 0.1574 58.3183);
  --chart-3: oklch(0.4732 0.1247 46.2007);
  --chart-4: oklch(0.5553 0.1455 48.9975);
  --chart-5: oklch(0.4732 0.1247 46.2007);
  --sidebar: oklch(0.1684 0 0);
  --sidebar-foreground: oklch(0.9219 0 0);
  --sidebar-primary: oklch(0.7686 0.1647 70.0804);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.4732 0.1247 46.2007);
  --sidebar-accent-foreground: oklch(0.9243 0.1151 95.7459);
  --sidebar-border: oklch(0.3715 0 0);
  --sidebar-ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: -1px;
  --shadow-opacity: 0.1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## 7. Implementation Requirements
*   **Structure:**
    *   `/backend` (Rust/Axum)
    *   `/frontend` (Next.js)
*   **API:** REST API in backend.
*   **DB:** Postgres with SeaORM.
*   **Auth:** BetterAuth (Next.js) + Axum middleware.
*   **Seed:** Ensure seed script is available.
*   **UI:** Clean Next.js UI with React Query.

## 8. What to Do First
1.  Initialize project structure.
2.  Set up backend with basic health check.
3.  Define SeaORM entities.
4.  Run migrations.
5.  Implement basic CRUD.
6.  Build minimal Next.js UI.

## 9. Style
*   Code should be clean, typed, and commented.
*   Prefer TypeScript everywhere (frontend).
*   Rust idiomatic code (backend).
*   Use clear naming.
*   Avoid overengineering.