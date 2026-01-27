# Roadmap: v2.0 OKR Restructure & Support Tasks

## Overview

Promote KeyResult from a free-text string to a first-class tracked entity with metrics, add support task management with KR linkage, reseed from updated Excel, and add a revenue target dashboard widget. The build follows a strict schema-first, seed-second, UI-last order because every downstream phase depends on the data model and seeded data. Phases 49-51 are parallelizable once the foundation (46-48) is in place.

**Phases:** 7 (46-52)
**Depth:** Quick
**Coverage:** 37/37 requirements mapped

---

## Phase 46: Schema Migration

**Goal:** Database supports the full OKR hierarchy (Objective > KeyResult > Initiative) and support task model with all required fields, enums, and relations.

**Dependencies:** None (foundation phase)

**Requirements:** SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08

**Plans:** 1 plan

Plans:
- [x] 46-01-PLAN.md -- Add KeyResult, SupportTask, SupportTaskKeyResult models + enums, modify Initiative, push to DB

**Success Criteria:**
1. `npx prisma db push` applies cleanly and `npx prisma generate` produces a client with KeyResult, SupportTask, SupportTaskKeyResult models, MetricType and SupportTaskCategory enums
2. Initiative model has keyResultId FK and budget/resources fields; kpiTarget, kpiActual, kpiUnit, kpiLabel, kpiManualOverride, monthlyObjective, weeklyTasks fields are removed
3. KeyResult model has all required fields: krId (unique), objective, description, metricType, target, actual, unit, progress, deadline, status, owner, howWeMeasure, notes, weight
4. SupportTask model has category (SupportTaskCategory enum), task, owner, frequency, priority, notes; SupportTaskKeyResult join table has composite unique on [supportTaskId, keyResultId]

**Pitfalls to watch:** C3 (MariaDB drift loop -- use `prisma db push` instead of `migrate dev`), C4 (KPI field removal -- acceptable since seed will repopulate)

---

## Phase 47: Seed Script Rewrite

**Goal:** Running `npx prisma db seed` populates the database with all OKR data from the v2 Excel file (6 KRs, 37 initiatives, 30 support tasks, events) with correct FK linkages.

**Dependencies:** Phase 46 (schema must exist)

**Requirements:** SEED-01, SEED-02, SEED-03, SEED-04, SEED-05, SEED-06

**Plans:** 1 plan

Plans:
- [x] 47-01-PLAN.md -- Rewrite seed.ts to parse v2 Excel (KeyResults, Initiatives, SupportTasks + join table) and v1 Excel (Events), with validation summary

**Success Criteria:**
1. Seed wipes OKR data cleanly (using FK_CHECKS=0 and correct deletion order) without destroying non-OKR production data (projects, companies, costs, documents)
2. After seeding, database contains exactly 6 KeyResult records, 37 Initiative records (each with valid keyResultId FK), and 30 SupportTask records
3. SupportTaskKeyResult join table is populated correctly -- including "All KRs" tasks linked to all 6 KeyResults, and comma-separated KR references parsed into individual links
4. Seed prints a validation summary showing counts of created records and flags any parsing warnings

**Pitfalls to watch:** C2 (cascade deletes -- use FK_CHECKS=0), H2 ("All KRs" parsing -- build KR lookup map before processing support tasks), M5 (delimiter inconsistency -- normalize aggressively)

---

## Phase 48: API Layer + Utilities

**Goal:** Application has working CRUD endpoints for KeyResults and SupportTasks, updated initiative endpoints, real revenue dashboard stats, and utility functions that group/calculate using the new relational model.

**Dependencies:** Phase 47 (seeded data needed for testing)

**Requirements:** API-01, API-02, API-03, API-04, UTIL-01, UTIL-02, UTIL-03

**Plans:** 3 plans

Plans:
- [ ] 48-01-PLAN.md -- Create KeyResult CRUD and SupportTask list API routes (3 new files)
- [ ] 48-02-PLAN.md -- Fix initiative routes and export to remove deleted field references, use keyResultId FK
- [ ] 48-03-PLAN.md -- Fix dashboard revenue, rewrite grouping utility, stub KPI utility, add KR progress utility

**Success Criteria:**
1. GET /api/key-results returns all 6 KRs with initiative counts; GET /api/key-results/[id] returns a single KR with its initiatives and linked support tasks; PATCH /api/key-results/[id] can update actual, progress, and status
2. GET /api/support-tasks returns all 30 tasks with KR relations; filtering by category query param returns only tasks in that category
3. Initiative API routes accept keyResultId (FK) instead of keyResult (string), include budget/resources in create/update, and no longer return KPI fields
4. Dashboard stats API computes revenue from KeyResult actual values (metricType=REVENUE) instead of the old initiative-completion proxy
5. Grouping utility groups initiatives by KeyResult relation (not string); KR progress calculation utility computes weighted objective rollup from KR weights and progress values

**Pitfalls to watch:** H3 (grouping breakage -- normalize at API layer during transition)

---

## Phase 49: OKR Hierarchy UI

**Goal:** Users see the objectives page with real KR-level metrics (target, actual, progress bar, status, owner) instead of aggregated initiative KPIs, with simplified initiative rows and updated forms.

**Dependencies:** Phase 48 (API endpoints and utilities must exist)
**Parallelizable with:** Phase 50, Phase 51

**Requirements:** UI-OKR-01, UI-OKR-02, UI-OKR-03, UI-OKR-04, UI-OKR-05, UI-OKR-06, UI-OKR-07

**Success Criteria:**
1. In the By Objective view, each KeyResult row displays: description, target vs actual, progress bar, unit, status badge, owner, and deadline -- all from the KR model, not aggregated from initiatives
2. Objective headers show weighted rollup progress calculated from child KR weights and progress values
3. Initiative rows show title, department, person in charge, status, start/end dates, and budget -- with no KPI progress bars
4. Initiative create/edit forms use a KeyResult dropdown (select from existing KRs) instead of free-text input, and include budget/resources fields
5. All 22 files referencing keyResult as string and all 8 files referencing KPI fields are updated or cleaned (verified against pitfalls Appendix A and B checklists)

**Pitfalls to watch:** C1 (22-file string-to-FK migration -- work through file list systematically), C4 (8-file KPI removal -- verify replacements built before removing), M2 (stale KPI aggregation)

---

## Phase 50: Support Tasks UI

**Goal:** Users can view and filter all 30 support tasks grouped by category, see which KRs each task supports, and navigate to support tasks from the sidebar.

**Dependencies:** Phase 48 (API endpoints must exist)
**Parallelizable with:** Phase 49, Phase 51

**Requirements:** UI-ST-01, UI-ST-02, UI-ST-03, UI-ST-04

**Success Criteria:**
1. /support-tasks page displays all 30 support tasks grouped into 4 categories (Design & Creative, Business & Admin, Talenta Ideas, Operations) with each task showing taskId, description, owner, frequency, priority, and linked KR badges
2. Category filter lets users show all categories or filter to a single category; default shows all
3. "Support Tasks" appears in the sidebar navigation under the OKR section
4. KR badges on support tasks are clickable and navigate to the relevant KR in the objectives view

---

## Phase 51: Revenue Target Widget

**Goal:** Dashboard shows a revenue target widget displaying RM1,000,000 total target with Events (RM800K) and AI Training (RM200K) breakdown, using real KR actual values.

**Dependencies:** Phase 48 (API endpoints and KR data must exist)
**Parallelizable with:** Phase 49, Phase 50

**Requirements:** UI-REV-01, UI-REV-02

**Success Criteria:**
1. Dashboard displays a revenue-target widget showing RM1,000,000 total target, current actual total, and overall progress -- with breakdown rows for Events (KR1.1, RM800K target) and AI Training (KR2.2, RM200K target)
2. Revenue-target widget is registered in the widget registry following the existing pattern, with appropriate role restrictions and default layout position

---

## Phase 52: Cleanup & Polish

**Goal:** Codebase has no dead code from the v1.5 KPI/string-keyResult system, export reflects the new data model, and all file migrations are verified complete.

**Dependencies:** Phase 49, Phase 50, Phase 51 (all feature phases must be complete)

**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03

**Success Criteria:**
1. No remaining references to initiative-level KPI fields or keyResult-as-string in source code; initiative-kpi-utils.ts is removed or fully repurposed; no stale type definitions
2. Excel export produces correct columns -- keyResult shows KR description instead of string code, budget/resources/accountable are included, KPI columns are removed
3. All 22 files from Pitfalls Appendix A (keyResult string refs) and all 8 files from Appendix B (KPI field refs) are verified fully migrated with no remnants

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 46 | Schema Migration | SCHEMA-01..08 | Complete |
| 47 | Seed Script Rewrite | SEED-01..06 | Complete |
| 48 | API Layer + Utilities | API-01..04, UTIL-01..03 | Pending |
| 49 | OKR Hierarchy UI | UI-OKR-01..07 | Pending |
| 50 | Support Tasks UI | UI-ST-01..04 | Pending |
| 51 | Revenue Target Widget | UI-REV-01..02 | Pending |
| 52 | Cleanup & Polish | CLEAN-01..03 | Pending |

## Dependency Graph

```
46 (Schema) --> 47 (Seed) --> 48 (API + Utils) --> 49 (OKR UI)
                                               --> 50 (Support Tasks UI)
                                               --> 51 (Revenue Widget)
                                                       |
                                               49 + 50 + 51 --> 52 (Cleanup)
```

---
*Created: 2026-01-27*
*Milestone: v2.0 OKR Restructure & Support Tasks*
