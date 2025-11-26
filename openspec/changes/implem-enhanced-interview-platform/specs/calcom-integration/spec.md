# calcom-integration Specification

## Purpose
Integrate Cal.com API for automated interview scheduling, team assignment, and calendar management to replace manual interview coordination.

## ADDED Requirements

### Requirement: Cal.com API Client Setup
The system SHALL establish secure API integration with Cal.com for scheduling functionality.

#### Scenario: API Authentication
- **GIVEN** the Cal.com API key `cal_live_119cbe75592ea3d9d7fbbc5e4ca26f41` is configured
- **WHEN** the system initializes
- **THEN** establish authenticated connection to Cal.com API
- **AND** validate API key health and permissions

#### Scenario: Error Handling
- **WHEN** Cal.com API returns error responses
- **THEN** log detailed error information
- **AND** provide user-friendly error messages
- **AND** implement exponential backoff for retries

### Requirement: Team Member Management
The system SHALL support Poblysh team member profiles with Cal.com user mapping for interview assignment.

#### Scenario: Add Team Member
- **GIVEN** an authenticated user with admin permissions
- **WHEN** they create a new team member profile
- **THEN** capture name, email, role, and optional Cal.com user ID
- **AND** validate email uniqueness within the system
- **AND** set team member as active by default

#### Scenario: Assign Interview to Team
- **GIVEN** an interview is being scheduled
- **WHEN** the user selects team members
- **THEN** display available active team members with their roles
- **AND** allow selection of primary interviewer and optional additional team members
- **AND** validate team member availability through Cal.com API

### Requirement: Guest Invitation System
The system SHALL manage external guest invitations for interviews with contact integration and invitation status tracking.

#### Scenario: Add Interview Guests
- **GIVEN** an interview is being created
- **WHEN** the user adds external participants
- **THEN** allow guest addition via contact selection or email entry
- **AND** capture guest name, email, role, and company information
- **AND** set invitation status to 'pending' by default

#### Scenario: Send Guest Invitations
- **WHEN** an interview booking is confirmed
- **THEN** automatically send calendar invitations to all guests
- **AND** update invitation status to 'sent'
- **AND** track invitation timestamps for follow-up

### Requirement: Interview Booking Workflow
The system SHALL provide a 6-step interview creation process with Cal.com integration and automated scheduling.

#### Scenario: Start Interview Creation
- **GIVEN** a user is on a startup page
- **WHEN** they click "Schedule Interview"
- **THEN** open interview creation modal with step indicator
- **AND** pre-select the current startup if applicable

#### Scenario: Step 1 - Select Startup & Contact
- **WHEN** users reach the first booking step
- **THEN** display startup search and selection
- **AND** show associated contacts for the selected startup
- **AND** allow adding new contacts inline if needed

#### Scenario: Step 2 - Assign Poblysh Team
- **WHEN** users proceed to team assignment
- **THEN** show available team members with roles and availability
- **AND** require selection of at least one primary interviewer
- **AND** allow selection of optional additional team members

#### Scenario: Step 3 - Choose Booking Type
- **WHEN** users select booking type
- **THEN** display available Cal.com event types with duration and descriptions
- **AND** show team member availability for each type
- **AND** allow custom duration entry for special cases

#### Scenario: Step 4 - Add External Guests
- **WHEN** users add external participants
- **THEN** provide contact search and manual email entry
- **AND** validate email formats before accepting
- **AND** show guest count and total meeting duration

#### Scenario: Step 5 - Customize Details
- **WHEN** users customize interview details
- **THEN** provide preparation notes field with rich text support
- **AND** allow custom question entry for structured interviews
- **AND** show meeting timezone and duration summary

#### Scenario: Step 6 - Send Invitation
- **WHEN** users confirm interview details
- **THEN** create Cal.com booking with selected parameters
- **AND** assign team members and guests to the interview
- **AND** send calendar invitations to all participants
- **AND** update interview status to 'scheduled'

### Requirement: Calendar Synchronization
The system SHALL synchronize interview status changes with Cal.com bookings through webhook integration.

#### Scenario: Booking Confirmation
- **WHEN** Cal.com sends BOOKING_CREATED webhook
- **THEN** update interview status to 'confirmed'
- **AND** store meeting URL and provider information
- **AND** notify assigned team members via email

#### Scenario: Booking Cancellation
- **WHEN** Cal.com sends BOOKING_CANCELLED webhook
- **THEN** update interview status to 'cancelled'
- **AND** notify all participants of cancellation
- **AND** free up team member availability

#### Scenario: Booking Rescheduling
- **WHEN** Cal.com sends BOOKING_RESCHEDULED webhook
- **THEN** update interview start and end times
- **AND** update calendar invitations for all participants
- **AND** notify team members of schedule changes

### Requirement: Enhanced Interview Data Model
The system SHALL extend the interview entity with booking lifecycle information and meeting details.

#### Scenario: Interview Booking Fields
- **GIVEN** an interview record exists
- **WHEN** viewed in the system
- **THEN** display invitation status (pending, confirmed, cancelled)
- **AND** show Cal.com booking ID for reference
- **AND** include meeting URL and provider information
- **AND** display scheduled start and end times

#### Scenario: Interview Preparation Context
- **GIVEN** an interview is scheduled
- **WHEN** team members view interview details
- **THEN** show preparation notes and custom questions
- **AND** display guest list with roles and companies
- **AND** provide one-click access to meeting URLs