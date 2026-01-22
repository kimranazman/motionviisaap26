# Phase 10: Companies & Contacts - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage companies and their contacts. Company CRUD with search/filter on a list page. Contact CRUD within company context (not standalone). Deals, potentials, and projects that reference companies are separate phases.

</domain>

<decisions>
## Implementation Decisions

### List & Navigation
- Table view for company list
- Click row opens company detail in modal (not full page, not panel)
- Search plus multiple filters (industry, contact count range, date added, etc.)

### Company Detail Page
- Modal opens on row click
- Inline editing — click field to edit in place, auto-saves
- Company fields: Name, Industry, Website, Address, Phone, Notes
- Industry field: combo box (select from presets OR type custom value)
- Delete requires confirmation dialog
- One contact can be marked as "primary" for the company

### Contact Management
- Contacts displayed as small cards within company modal
- Each card shows key info (name, role, email, phone)
- Edit follows same inline pattern as company
- Primary contact designation visible on card

### Empty & Edge States
- No contacts in company: prompt with "Add your first contact" + button
- Skeleton loaders while fetching data

### Claude's Discretion
- Table columns for company list
- Modal layout and section organization
- Modal width/sizing
- Address field structure (single vs structured)
- Contact fields selection
- How to add new contact (inline form vs nested modal)
- Empty state for no companies
- Search empty state treatment

</decisions>

<specifics>
## Specific Ideas

- Modal pattern keeps user context — list stays visible behind modal
- Inline editing should feel immediate, no "save" button needed
- Combo box for industry allows flexibility without forcing freeform

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-companies-contacts*
*Context gathered: 2026-01-22*
