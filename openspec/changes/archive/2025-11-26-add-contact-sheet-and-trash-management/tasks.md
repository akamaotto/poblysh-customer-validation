## 1. Backend
- [x] 1.1 Add `is_trashed` boolean to Contact entity + migrations
- [x] 1.2 Track creator/owner on contacts if not already stored so trash permissions can be enforced
- [x] 1.3 Update contact list/create/update/delete endpoints to surface trash status and restrict trash action to owner or admin
- [x] 1.4 Add admin endpoints/actions for listing trashed contacts, restoring, and permanently deleting (single + bulk)

## 2. Frontend
- [x] 2.1 Add "View" button to contacts table that opens a left sheet showing all contact details
- [x] 2.2 Include Trash, Edit, and Email buttons in the sheet footer; reuse email compose modal and existing edit form
- [x] 2.3 Only allow trashing contacts created by the current user and reflect trash status in UI
- [x] 2.4 Add admin-only trash filter/tabs plus bulk restore/permanent delete controls in the contacts section

## 3. Documentation & Validation
- [x] 3.1 Document the trash workflow and admin tools in README / project notes
- [x] 3.2 Update OpenSpec change status once implementation is complete and validated
