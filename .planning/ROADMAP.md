# Roadmap: SAAP2026v2

## Overview

Complete the SAAP2026v2 UI by filling gaps in navigation, initiative detail views, header features, and Kanban interactions. This brownfield project has solid foundations (Kanban, Gantt, Calendar views working); we're finishing the incomplete elements to deliver a polished internal tool.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Navigation & Detail Page** - Clean up dead links and build the detail page they should point to
- [ ] **Phase 2: Header Features** - Add working search and notification bell
- [ ] **Phase 3: Kanban Quick Actions** - Enable status change and reassignment from context menu

## Phase Details

### Phase 1: Navigation & Detail Page
**Goal**: Users can access initiative detail pages without hitting dead ends
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, DETL-01, DETL-02, DETL-03
**Success Criteria** (what must be TRUE):
  1. User clicks any initiative link and lands on /initiatives/[id] with full details
  2. User can edit initiative fields directly on the detail page
  3. User can view existing comments and add new comments on detail page
  4. Sidebar has no Settings link (no 404)
  5. User dropdown shows no non-functional items (Profile/Settings/Logout removed)
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Remove dead navigation links (Settings, Profile, Edit)
- [x] 01-02-PLAN.md — Create initiative detail page with inline editing and comments

### Phase 2: Header Features
**Goal**: Users can discover initiatives through search and get alerted to at-risk items
**Depends on**: Phase 1 (notification links need detail page)
**Requirements**: SRCH-01, NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. User types in header search and sees filtered initiative results
  2. User sees badge count on bell icon showing overdue/at-risk initiatives
  3. User clicks bell and sees popover list with links to each at-risk initiative
**Plans**: TBD

Plans:
- [ ] 02-01: Global search implementation
- [ ] 02-02: Notification bell with badge and popover

### Phase 3: Kanban Quick Actions
**Goal**: Users can update initiatives directly from Kanban board without opening forms
**Depends on**: Phase 1 (uses same data patterns)
**Requirements**: KANB-01, KANB-02
**Success Criteria** (what must be TRUE):
  1. User right-clicks Kanban card, selects "Change Status", and status updates immediately
  2. User right-clicks Kanban card, selects "Reassign", picks new owner, and card updates
**Plans**: TBD

Plans:
- [ ] 03-01: Kanban context menu actions (Change Status, Reassign)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Navigation & Detail Page | 2/2 | ✓ Complete | 2026-01-20 |
| 2. Header Features | 0/2 | Not started | - |
| 3. Kanban Quick Actions | 0/1 | Not started | - |
