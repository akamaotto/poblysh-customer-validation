# contact-management Specification

## Purpose
TBD - created by archiving change add-contact-sheet-and-trash-management. Update Purpose after archive.
## Requirements
### Requirement: Contact Detail Sheet
The system SHALL provide a contact detail sheet that can be opened from any contact list without leaving the page.

#### Scenario: View contact sheet
- **WHEN** a user clicks "View" on a contact
- **THEN** open a left-side sheet displaying all stored attributes (name, role, email, phone, LinkedIn, notes, ownership metadata)
- **AND** keep the startup detail view visible in the background so context is preserved

#### Scenario: Sheet actions
- **WHEN** the sheet is open
- **THEN** show Trash, Edit, and Email buttons pinned at the bottom
- **AND** clicking Email SHALL reuse the existing email compose modal targeted at that contact

### Requirement: Contact Trash Workflow
The system SHALL support soft-deleting contacts via a boolean `is_trashed` flag with ownership-based permissions.

#### Scenario: Trash own contact
- **GIVEN** the authenticated user created the contact
- **WHEN** they click Trash in the contact sheet
- **THEN** set `is_trashed=true` and hide the contact from default lists
- **AND** show a confirmation toast indicating the contact moved to trash

#### Scenario: Prevent trashing others' contacts
- **GIVEN** the contact was created by a different user and the current user is not an admin
- **WHEN** they open the sheet
- **THEN** the Trash button SHALL be disabled with helper text explaining only owners or admins may trash

### Requirement: Admin Trash Management
Admins SHALL be able to review, restore, and permanently delete trashed contacts from the same contacts feature page.

#### Scenario: Admin trash filter
- **WHEN** an admin views the contacts section
- **THEN** they can toggle a "Trashed" filter/tab that lists only contacts with `is_trashed=true`
- **AND** non-admin users SHALL not see this filter

#### Scenario: Restore or delete single contact
- **WHEN** an admin selects a trashed contact from the filter view
- **THEN** they can choose "Put Back" to set `is_trashed=false`
- **OR** choose "Delete Forever" to remove the record permanently after confirming

#### Scenario: Bulk admin actions
- **WHEN** an admin selects multiple trashed contacts or clicks "Select All"
- **THEN** they can run Put Back All or Delete All actions, with confirmations for destructive operations

