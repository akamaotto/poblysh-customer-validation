## ADDED Requirements
### Requirement: Weekly Metric Configuration
The system SHALL let admins define weekly input metrics (e.g., contacts added, startups added, outreach done) plus map kanban stages to output metrics inside the settings area.

#### Scenario: Admin saves metric definitions for a week
- **WHEN** an admin adds or edits metric definitions for the upcoming week and supplies name, unit label, owner, and target value per metric
- **THEN** the system persists those definitions and marks them as the active plan for that calendar week

### Requirement: Weekly Metric Tracking
The system SHALL track actual counts for every configured input and output metric, update them as activities happen, and snapshot results at the end of each week.

#### Scenario: Activities increment metrics in real time
- **WHEN** a user logs a contact, startup, outreach, meeting, or moves an item across kanban stages that has a mapped metric
- **THEN** the corresponding metric’s actual count increments immediately and is available to dashboards and reports

#### Scenario: Week closes with final snapshot
- **WHEN** the week ends or an admin manually closes it
- **THEN** the system stores the final counts for every metric so historical comparisons are preserved

### Requirement: Dashboard Weekly Summary and Activity Preview
The dashboard SHALL display weekly goal vs. actual performance and the 20 most recent activity entries with a link to the full activity feed page.

#### Scenario: Dashboard shows latest summary
- **WHEN** a user opens the dashboard during an active week
- **THEN** the weekly metrics card shows each metric’s target, actual, and status plus an activity list limited to the 20 newest entries and a “View all activity” link

### Requirement: Activity Feed Page
The system SHALL provide a dedicated page listing all activity entries with pagination, keyword search, and filters by date range, startup, kanban stage, contact, user, and activity type.

#### Scenario: User filters and paginates activity
- **WHEN** a user opens the activity feed page, applies any combination of supported filters or search text, and navigates pages
- **THEN** the list updates to show only matching activity entries, indicates the total count, and keeps pagination consistent with the applied filters
