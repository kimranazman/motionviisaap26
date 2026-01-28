# Roadmap: SAAP 2026 v2

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- ✅ **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22)
- ✅ **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22)
- ✅ **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23)
- ✅ **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (shipped 2026-01-24)
- ✅ **v1.3.1 Revenue Model Refinement** - Phase 26 (shipped 2026-01-24)
- ✅ **v1.3.2 Conversion Visibility & Archive** - Phases 27-28 (shipped 2026-01-24)
- ✅ **v1.4 Intelligent Automation & Organization** - Phases 29-35 (shipped 2026-01-25)
- ✅ **v1.4.1 Line Item Categorization** - Phase 36 (shipped 2026-01-25)
- ✅ **v1.4.2 UI Polish & Bug Fixes** - Phase 37 (shipped 2026-01-26)
- ✅ **v1.5 Initiative Intelligence & Export** - Phases 38-42 (shipped 2026-01-26)
- ✅ **v1.5.1 Site Audit Fixes & Detail View Preferences** - Phases 43-45 (shipped 2026-01-27)
- ✅ **v2.0 OKR Restructure & Support Tasks** - Phases 46-53 (shipped 2026-01-27)
- ✅ **v2.1 Navigation & Views** - Phases 54-56 (shipped 2026-01-28)
- ✅ **v2.2 Bug Fixes & UX Polish** - Phases 57-61 (shipped 2026-01-28)
- ✅ **v2.3 CRM & UX Improvements** - Phases 62-67 (shipped 2026-01-28)
- ✅ **v2.4 Settings, Sidebar & Bug Fixes** - Phases 68-71 (shipped 2026-01-28)
- ◆ **v2.5 Navigation Reorganization** - Phases 72-74 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v2.4 (Phases 1-71) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

</details>

### v2.5 Navigation Reorganization

#### Phase 72: Create Work Group & Move Items ✓

**Goal:** Create a new "Work" navigation group containing Projects and Tasks together.

**Status:** Complete (2026-01-28)

**Delivered:**
- Work nav group added between SAAP and CRM
- Projects moved from CRM to Work group
- Tasks moved from topLevelItems to Work group
- Both desktop and mobile sidebars updated

---

#### Phase 73: Rename Potential Projects to Repeat Clients

**Goal:** Rename "Potential Projects" to "Repeat Clients" throughout the application UI.

**Requirements:**
- RENAME-01: Change nav label to "Repeat Clients"
- RENAME-02: Update page title
- RENAME-03: Update component headers/breadcrumbs
- RENAME-04: Update toast messages and UI text

**Success Criteria:**
1. Sidebar shows "Repeat Clients" instead of "Potential Projects"
2. Page title is "Repeat Clients"
3. All UI references say "Repeat Clients"
4. URL remains `/potential-projects` (implementation detail)
5. Database model remains `PotentialProject` (internal)

**Files to modify:**
- `src/lib/nav-config.ts`
- `src/app/(protected)/potential-projects/page.tsx`
- `src/components/potential-project-*.tsx` (headers/titles)

---

#### Phase 74: Members Quick Navigation Links

**Goal:** Add clickable children to Members nav item for quick access to individual team member pages.

**Requirements:**
- MBR-01: Add children array to Members nav item
- MBR-02: Create child items for Khairul, Azlan, Izyani
- MBR-03: Apply nested nav pattern from Companies
- MBR-04: Keep parent /members link clickable
- MBR-05: Update topLevelItems structure for children support

**Success Criteria:**
1. Members in sidebar shows expand chevron
2. Clicking expand reveals Khairul, Azlan, Izyani links
3. Each child link navigates to /members/[name]
4. Clicking Members parent still goes to /members overview
5. Nested styling matches Companies/Departments/Contacts pattern
6. Mobile sidebar shows same expandable behavior

**Files to modify:**
- `src/lib/nav-config.ts`
- `src/components/sidebar.tsx`
- `src/components/mobile-sidebar.tsx`
- `src/components/nav-group.tsx` (if needed for top-level nested items)

---

## Progress

Phase 73 of 74 | v2.5 in progress

Progress: [███░░░░░░░] 33% (1/3 v2.5 phases)
