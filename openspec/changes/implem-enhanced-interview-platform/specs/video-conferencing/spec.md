# video-conferencing Specification

## Purpose
Enable multi-platform video conferencing integration with automatic meeting creation, one-click join functionality, and meeting link management across Zoom, Google Meet, Microsoft Teams, and Cal.com Video.

## ADDED Requirements

### Requirement: Platform Detection and Meeting URL Extraction
The system SHALL automatically detect video conferencing platforms from Cal.com booking data and extract meeting information for unified access.

#### Scenario: Zoom Meeting Detection
- **WHEN** Cal.com booking contains Zoom meeting URL
- **THEN** extract meeting ID and password from the URL
- **AND** display Zoom platform icon and branding
- **AND** format "Join Meeting" button with Zoom-specific styling
- **AND** provide meeting ID and password for manual join

#### Scenario: Google Meet Detection
- **WHEN** Cal.com booking contains Google Meet URL
- **THEN** extract meeting code from meet.google.com URL
- **AND** display Google Meet platform icon and branding
- **AND** format "Join Meeting" button with Meet-specific styling
- **AND** provide meet code for easy reference

#### Scenario: Microsoft Teams Detection
- **WHEN** Cal.com booking contains Microsoft Teams meeting URL
- **THEN** extract meeting details from teams.microsoft.com URL
- **AND** display Teams platform icon and branding
- **AND** format "Join Meeting" button with Teams-specific styling
- **AND** provide meeting join instructions

#### Scenario: Cal.com Video Detection
- **WHEN** Cal.com booking uses built-in video service
- **THEN** display Cal.com Video platform icon and branding
- **AND** format "Join Meeting" button for Cal.com video interface
- **AND** handle Cal.com video authentication and access

#### Scenario: Unknown Platform Handling
- **WHEN** meeting URL doesn't match known platforms
- **THEN** display generic video meeting icon
- **AND** show "Join Meeting" button with standard styling
- **AND** provide full URL for manual access
- **AND** enable manual platform selection

### Requirement: One-Meeting Join Interface
The system SHALL provide unified meeting access interface with platform-specific launch options and meeting information display.

#### Scenario: Meeting Join Button
- **GIVEN** an interview is scheduled with video conferencing
- **WHEN** the interview interface displays meeting information
- **THEN** show platform-specific "Join Meeting" button
- **AND** open meeting in new tab when clicked
- **AND** display meeting status (Upcoming, Starting Soon, In Progress)

#### Scenario: Meeting Information Display
- **WHEN** meeting details are available
- **THEN** display meeting platform name and icon
- **AND** show meeting ID or code when applicable
- **AND** display meeting password or access instructions
- **AND** show meeting start time with timezone

#### Scenario: Meeting Launch Options
- **WHEN** multiple join options are available
- **THEN** provide "Launch in Browser" option for web-based meetings
- **AND** provide "Open App" option for desktop applications
- **AND** show "Copy Link" option for manual sharing
- **AND** display "Add to Calendar" option for additional calendar apps

### Requirement: Meeting Status Tracking
The system SHALL track meeting lifecycle status and synchronize with interview progression for accurate status management.

#### Scenario: Pre-Meeting Status
- **GIVEN** an interview is scheduled for the future
- **WHEN** current time is more than 15 minutes before start
- **THEN** display meeting status as "Scheduled"
- **AND** show countdown to meeting start time
- **AND** enable "Join Meeting" button but show time until available

#### Scenario: Meeting Starting Soon
- **WHEN** current time is within 15 minutes of meeting start
- **THEN** update meeting status to "Starting Soon"
- **AND** enable "Join Meeting" button with active state
- **AND** show prominent "Join Now" call-to-action
- **AND** send browser notification if enabled

#### Scenario: Meeting In Progress
- **WHEN** current time is between scheduled start and end times
- **THEN** update meeting status to "In Progress"
- **AND** show meeting duration timer
- **AND** highlight "Join Meeting" button for late participants
- **AND** display meeting controls status indicators

#### Scenario: Meeting Completed
- **WHEN** current time is past scheduled end time
- **THEN** update meeting status to "Completed"
- **AND** show "View Meeting" button for post-meeting access
- **AND** enable recording and transcript upload options
- **AND** trigger post-interview evaluation workflow

### Requirement: Recording and Transcript Management
The system SHALL support meeting recording uploads, transcript management, and media association with interview records.

#### Scenario: Recording Upload Interface
- **WHEN** interview is marked as completed
- **THEN** provide "Upload Recording" option in interview interface
- **AND** support video file formats (MP4, MOV, M4V)
- **AND** show upload progress with percentage and time estimates
- **AND** enable recording description and timestamp tagging

#### Scenario: Transcript Upload and Processing
- **WHEN** meeting transcript is available
- **THEN** provide "Upload Transcript" option
- **AND** support text file formats (TXT, VTT, SRT)
- **AND** enable transcript synchronization with recording timestamps
- **AND** make transcript searchable within interview context

#### Scenario: Media Gallery Display
- **WHEN** recordings and transcripts are associated with interview
- **THEN** display media gallery with thumbnail previews
- **AND** show recording duration and file size information
- **AND** provide download options for team members
- **AND** enable sharing links for external stakeholders

### Requirement: Meeting Integration Settings
The system SHALL provide configurable video conferencing preferences and integration management for teams.

#### Scenario: Platform Preference Settings
- **WHEN** team members configure interview preferences
- **THEN** allow selection of preferred video platforms
- **AND** enable platform-specific account linking
- **AND** show platform availability and requirements
- **AND** provide setup guides for each platform

#### Scenario: Default Meeting Settings
- **WHEN** configuring interview types
- **THEN** set default video platform for each interview type
- **AND** configure automatic meeting creation preferences
- **AND** enable recording preference defaults
- **AND** set meeting reminder timing preferences

#### Scenario: Integration Management
- **WHEN** managing video platform integrations
- **THEN** display connection status for each platform
- **AND** provide reconnection and troubleshooting options
- **AND** show API usage and rate limit information
- **AND** enable integration disable/enable controls

### Requirement: Meeting Link Management
The system SHALL manage meeting URLs, updates, and distribution for all interview participants.

#### Scenario: Meeting URL Updates
- **WHEN** Cal.com booking meeting URL changes
- **THEN** automatically update interview record with new URL
- **AND** notify assigned team members of URL changes
- **AND** update meeting link for all external guests
- **AND** maintain meeting URL history for audit purposes

#### Scenario: Meeting Link Distribution
- **WHEN** interview is confirmed and scheduled
- **THEN** automatically distribute meeting links to all participants
- **AND** include meeting information in calendar invitations
- **AND** send reminder emails with meeting access details
- **AND** provide meeting link access in interview interface

#### Scenario: Backup Meeting Options
- **WHEN** primary video platform is unavailable
- **THEN** provide backup meeting creation options
- **AND** enable manual meeting URL entry
- **AND** suggest alternative video platforms
- **AND** allow meeting rescheduling with different platform