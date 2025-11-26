# Change: Weekly Activity Tracking and Feed

## Why
Customer validation leads want a lightweight way to set weekly activity goals and see whether inputs (contacts, outreach, startups) and pipeline movement hit expectations, plus a visible activity log for accountability.

## What Changes
- Settings area gains configuration for weekly input metrics (contacts added, startups added, outreach done) and kanban-based output metrics.
- System tracks weekly progress for each configured metric, snapshots it, and surfaces it on the dashboard next to Synthesis summaries.
- Dashboard shows a recent activity feed list (~20 items) with link to a full feed page supporting pagination, search, and filters.

## Impact
- Affected specs: team-activity-tracking
- Affected code: settings UI/backend, activity logging, dashboard widgets, new activity feed page, metrics aggregation jobs
