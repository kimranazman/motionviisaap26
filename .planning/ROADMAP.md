# Roadmap: v1.2.1 Responsive / Mobile Web

**Created:** 2026-01-22
**Core Value:** Full editing workflow on any device - phone, tablet, or desktop
**Depth:** Quick
**Phases:** 5 (Phases 16-20)
**Requirements:** 32

## Overview

Transform SAAP from desktop-only to fully responsive across phone, tablet, and desktop. Navigation provides the foundation with mobile-specific patterns (bottom nav, collapsed sidebar). Then each component type (Kanban, tables, forms, dashboard/detail pages) receives responsive treatment in logical order.

## Phases

### Phase 16: Navigation & Layout Foundation

**Goal:** Users can navigate SAAP on any device with appropriate navigation patterns

**Dependencies:** None (foundation phase)

**Plans:** 2 plans

Plans:
- [x] 16-01-PLAN.md - Responsive layout foundation with bottom navigation
- [x] 16-02-PLAN.md - Mobile sidebar and responsive header

**Requirements:**
- NAV-01: Bottom navigation bar appears on mobile screens (<768px)
- NAV-02: Bottom nav includes key links (Dashboard, Initiatives, CRM, Events)
- NAV-03: Sidebar hidden on mobile, visible on tablet/desktop
- NAV-04: Header adapts to mobile (search icon instead of full search bar)
- NAV-05: User menu accessible on all screen sizes

**Success Criteria:**
1. User on phone sees bottom nav bar and can tap to navigate between Dashboard, Initiatives, CRM, Events
2. User on phone does not see sidebar; user on tablet/desktop sees full sidebar
3. User on phone sees collapsed search icon; tapping it reveals search input
4. User on any device can access their profile menu and sign out

---

### Phase 17: Kanban Responsive

**Goal:** Users can view and manage Kanban boards on touch devices

**Dependencies:** Phase 16 (navigation must work on mobile first)

**Plans:** 3 plans

Plans:
- [x] 17-01-PLAN.md - Touch sensors and scroll containers for all boards
- [x] 17-02-PLAN.md - Responsive columns and touch-friendly cards
- [x] 17-03-PLAN.md - Mobile quick actions and responsive filter bar

**Requirements:**
- KAN-01: Kanban columns scroll horizontally on mobile
- KAN-02: Column edges visible to indicate more columns exist
- KAN-03: Cards touch-friendly with adequate tap targets
- KAN-04: Drag-and-drop works on touch devices
- KAN-05: Quick actions menu accessible on mobile
- KAN-06: Applies to all 3 Kanban boards (Initiatives, Pipeline, Potentials)

**Success Criteria:**
1. User on phone can swipe horizontally through Kanban columns and sees partial edges of adjacent columns
2. User on phone can tap and hold a card to drag it to a different column
3. User on phone can long-press or tap a card to access quick actions (change status, reassign)
4. All three Kanban boards (Initiatives, Pipeline, Potentials) work identically on mobile

---

### Phase 18: Tables Responsive

**Goal:** Users can browse and interact with data tables on mobile

**Dependencies:** Phase 16 (navigation must work on mobile first)

**Plans:** 3 plans

Plans:
- [x] 18-01-PLAN.md - Companies table responsive with priority columns
- [x] 18-02-PLAN.md - Initiatives list table responsive with priority columns
- [x] 18-03-PLAN.md - Admin users table responsive with priority columns

**Requirements:**
- TBL-01: Tables show priority columns only on mobile
- TBL-02: Secondary columns hidden on mobile, visible on tablet+
- TBL-03: Action buttons remain accessible on mobile
- TBL-04: Filter/search controls work on mobile
- TBL-05: Applies to all tables (Companies, Contacts, Projects, Costs, Initiatives list)

**Success Criteria:**
1. User on phone sees essential columns (name, status, key metric) without horizontal scrolling
2. User on tablet/desktop sees full column set including secondary data
3. User on phone can filter/search tables and access row actions (edit, delete) via touch
4. All data tables (Companies, Contacts, Projects, Costs, Initiatives list) follow same responsive pattern

---

### Phase 19: Forms & Modals Responsive

**Goal:** Users can create and edit data using forms on mobile

**Dependencies:** Phase 16 (navigation foundation)

**Plans:** 3 plans

Plans:
- [x] 19-01-PLAN.md - Base UI components responsive (Dialog, Sheet, Input, Select, Calendar)
- [x] 19-02-PLAN.md - Forms mobile stacking (Initiative, Deal, Company, Contact)
- [x] 19-03-PLAN.md - Remaining forms mobile stacking (Project, Potential, Cost)

**Requirements:**
- FRM-01: Modals become full-screen on mobile
- FRM-02: Form fields stack vertically on mobile
- FRM-03: Input fields have adequate touch target size
- FRM-04: Date pickers work on mobile
- FRM-05: Select dropdowns work on mobile
- FRM-06: Detail sheets (slide-out panels) full-width on mobile

**Success Criteria:**
1. User on phone sees modals as full-screen overlays with easy close button
2. User on phone can fill out all form fields without misclicks (min 44px touch targets)
3. User on phone can select dates and dropdown options without issues
4. Detail sheets slide from bottom on mobile and fill screen width

---

### Phase 20: Dashboard & Detail Pages

**Goal:** Users can view dashboard KPIs and detail pages on mobile

**Dependencies:** Phase 16-19 (all responsive foundations in place)

**Requirements:**
- DSH-01: KPI cards stack vertically on mobile (1 column)
- DSH-02: KPI cards show 2 columns on tablet
- DSH-03: Pipeline stage chart readable on mobile
- DSH-04: Chart legends don't overflow
- DSH-05: Filter controls work on mobile
- DET-01: Initiative detail page responsive layout
- DET-02: Company detail page responsive layout
- DET-03: Tabs/sections stack appropriately on mobile
- DET-04: Inline editing works on mobile
- DET-05: Comments section readable on mobile

**Success Criteria:**
1. User on phone sees KPI cards stacked vertically (1 column); user on tablet sees 2 columns
2. User on phone can read pipeline chart and legends without overflow or truncation
3. User on phone can view Initiative and Company detail pages with properly stacked sections
4. User on phone can use inline editing and read/add comments on detail pages

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 16 | Navigation & Layout Foundation | 5 | Complete |
| 17 | Kanban Responsive | 6 | Complete |
| 18 | Tables Responsive | 5 | Complete |
| 19 | Forms & Modals Responsive | 6 | Complete |
| 20 | Dashboard & Detail Pages | 10 | Pending |

**Coverage:** 32/32 requirements mapped

---
*Roadmap created: 2026-01-22*
*Last updated: 2026-01-23 (Phase 19 complete)*
