# structured-interview-interface Specification

## Purpose
Provide a structured 5-stage interview interface with JTBD framework guidance, real-time note capture, and integrated video conferencing for consistent, high-quality customer interviews.

## ADDED Requirements

### Requirement: 5-Stage Interview Framework
The system SHALL guide interviewers through a structured 5-stage interview process with stage-specific questions and time management.

#### Scenario: Stage 1 - Context & Frame Setting (0-3 minutes)
- **WHEN** an interview begins and stage 1 is active
- **THEN** display stage title "Context & Frame Setting" with 3-minute timer
- **AND** show guided prompts: "Build rapport", "Set expectations", "Clarify this is validation, not sales"
- **AND** provide question suggestions: "Can you tell me about your role?", "What does your company do?"
- **AND** enable real-time note capture with automatic timestamps

#### Scenario: Stage 2 - Current Workflow Discovery (3-8 minutes)
- **WHEN** stage 1 completes and stage 2 begins
- **THEN** display stage title "Current Workflow Discovery" with 5-minute timer
- **AND** show guided prompts: "Map their process", "Identify pain points", "Understand success metrics"
- **AND** provide question suggestions: "How do you currently handle this?", "What tools do you use?", "What frustrates you most?"
- **AND** highlight note-taking areas for pain points and workflows

#### Scenario: Stage 3 - Solution Demonstration (8-15 minutes)
- **WHEN** stage 2 completes and stage 3 begins
- **THEN** display stage title "Solution Demonstration" with 7-minute timer
- **AND** show guided prompts: "Show relevant features", "Gather reactions", "Address questions"
- **AND** provide product-specific talking points based on previous insights
- **AND** capture immediate reactions and feedback with sentiment tagging

#### Scenario: Stage 4 - Jobs-to-be-Done Deep Dive (15-25 minutes)
- **WHEN** stage 3 completes and stage 4 begins
- **THEN** display stage title "Jobs-to-be-Done Deep Dive" with 10-minute timer
- **AND** show structured JTBD capture fields: Functional, Social, Emotional jobs
- **AND** provide question suggestions: "What outcome are you trying to achieve?", "How do you want to be perceived?", "How do you want to feel during this process?"
- **AND** enable priority scoring for each identified job

#### Scenario: Stage 5 - Decision & Next Steps (25-30 minutes)
- **WHEN** stage 4 completes and stage 5 begins
- **THEN** display stage title "Decision & Next Steps" with 5-minute timer
- **AND** show guided prompts: "Assess interest", "Identify decision makers", "Define next steps"
- **AND** provide question suggestions: "How interested are you in solving this?", "Who else needs to be involved?", "What would be your timeline?"
- **AND** capture decision criteria and timeline information

### Requirement: Stage Navigation and Progress Tracking
The system SHALL provide clear stage navigation with progress indicators and flexible stage transitions.

#### Scenario: Stage Progress Indicator
- **WHEN** an interview is in progress
- **THEN** display horizontal progress bar showing 5 stages
- **AND** highlight current stage with active state
- **AND** show completed stages with checkmarks
- **AND** display time remaining for current stage

#### Scenario: Stage Navigation Controls
- **WHEN** interviewers need to navigate between stages
- **THEN** provide "Previous Stage" and "Next Stage" buttons
- **AND** allow jumping to any stage from progress bar
- **AND** show confirmation dialog when skipping stages
- **AND** maintain stage completion state across navigation

#### Scenario: Stage Time Management
- **WHEN** stages are approaching their time limits
- **THEN** show visual warning when 80% of stage time is used
- **AND** display time remaining in prominent format
- **AND** allow stage time extension with reason capture
- **AND** show overall interview progress time

### Requirement: Real-time Note Capture
The system SHALL enable real-time note capture with automatic timestamps, insight tagging, and JTBD field association.

#### Scenario: Timestamped Note Entry
- **WHEN** interviewers type notes during any stage
- **THEN** automatically timestamp each note entry with current stage time
- **AND** store note content with stage context and time offset
- **AND** enable rich text formatting for emphasis and structure

#### Scenario: Insight Tagging System
- **WHEN** interviewers capture important insights
- **THEN** provide quick-tag buttons for common insight types: Pain, Outcome, Feature, Objection
- **AND** allow custom tag creation for unique insights
- **AND** associate tags with specific stages and time points
- **AND** enable tag filtering during review

#### Scenario: JTBD Field Association
- **WHEN** stage 4 (JTBD Deep Dive) is active
- **THEN** show dedicated fields for Functional, Social, and Emotional jobs
- **AND** enable drag-and-drop of notes into JTBD categories
- **AND** provide importance scoring (1-5) for each job
- **AND** show JTBD field completion indicators

### Requirement: Video Conferencing Integration
The system SHALL provide integrated video conferencing access with meeting controls and recording management.

#### Scenario: Meeting Join Interface
- **GIVEN** an interview is scheduled with video conferencing
- **WHEN** the interview interface loads
- **THEN** display "Join Meeting" button with platform icon (Zoom, Meet, Teams)
- **AND** show meeting ID and join information
- **AND** provide one-click meeting launch in new tab

#### Scenario: Meeting Status Tracking
- **WHEN** video meeting is active
- **THEN** update interview status to "In Progress"
- **AND** show meeting duration timer
- **AND** enable recording status indicator when applicable
- **AND** provide meeting controls (mute, video toggle indicators)

#### Scenario: Recording Management
- **WHEN** video recording is available
- **THEN** show recording status in interview interface
- **AND** provide recording URL access when available
- **AND** enable transcript upload and association
- **AND** link recordings to interview insights

### Requirement: Interview Preparation and Context
The system SHALL display relevant interview context and preparation materials for informed interview execution.

#### Scenario: Pre-Interview Briefing
- **GIVEN** an interview is scheduled
- **WHEN** the interview interface loads before start time
- **THEN** display startup information and contact details
- **AND** show preparation notes and custom questions
- **AND** list assigned team members and their roles
- **AND** display previous interview history if applicable

#### Scenario: Guest Information Display
- **WHEN** external guests are invited
- **THEN** show guest names, roles, and companies
- **AND** display guest LinkedIn profiles when available
- **AND** show guest invitation status
- **AND** provide guest-specific talking points when available

### Requirement: Interview Completion and Summary
The system SHALL provide comprehensive interview completion workflow with summary generation and next steps capture.

#### Scenario: Interview Completion
- **WHEN** all stages are completed or interview time expires
- **THEN** display interview completion screen
- **AND** show captured insights summary with tag counts
- **AND** display JTBD job prioritization
- **AND** provide overall assessment options

#### Scenario: Immediate Next Steps
- **WHEN** interview completion is confirmed
- **THEN** prompt for immediate next actions: "Send follow-up email", "Schedule follow-up call", "Update pipeline status"
- **AND** enable quick status updates with predefined options
- **AND** capture interviewer confidence rating (1-5)
- **AND** set automated follow-up triggers based on outcomes