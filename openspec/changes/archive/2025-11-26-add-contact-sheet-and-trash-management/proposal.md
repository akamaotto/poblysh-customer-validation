# Change: Contact Sheet and Trash Management

## Why
PMs need a quick way to inspect a contact's full profile without losing their place in the startup detail view, and ops teams need a reversible "trash" workflow before permanently deleting contacts. Today contacts can only be edited inline and deletes are destructive, which makes recovery difficult and hides critical context.

## What Changes
- Add a per-contact "View" action that opens a left-side sheet showing every stored attribute plus metadata
- Include contextual actions (trash, edit, email) inside the sheet, reusing the existing compose modal for email
- Introduce a soft-delete boolean flag so users can move only their own contacts to trash while admins can review & restore or permanently delete
- Provide admin-only filtering and bulk actions for trashed contacts within the startup contacts section

## Impact
- Affected specs: contact-management (new capability)
- Affected code: frontend contact list & hooks, backend contact entity + APIs, email compose integration, admin filtering UI
