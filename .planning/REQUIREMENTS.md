# Requirements: v2.0 OKR Restructure & Support Tasks

## Overview

Promote KeyResult from a free-text string to a first-class tracked entity, add support task management with KR linkage, reseed from updated Excel, and add revenue target dashboard widget.

**Source:** MotionVii_SAAP_2026_v2.xlsx (6 KRs, 37 initiatives, 30 support tasks)

---

## SCHEMA: Data Model Changes

### SCHEMA-01: KeyResult Model
KeyResult becomes a first-class Prisma model with fields: krId (String, unique), objective (Objective enum), description (String), metricType (MetricType enum: REVENUE, COUNT), target (Decimal), actual (Decimal, default 0), unit (String), progress (Decimal, default 0), deadline (String), status (KeyResultStatus enum: NOT_STARTED, ON_TRACK, AT_RISK, BEHIND, ACHIEVED), owner (String), howWeMeasure (String), notes (String, optional), weight (Decimal, default 1.0). Has one-to-many relation to Initiative and many-to-many relation to SupportTask.

### SCHEMA-02: MetricType Enum
New enum MetricType with values REVENUE and COUNT (from Excel metricType column).

### SCHEMA-03: KeyResultStatus Enum
New enum KeyResultStatus with values NOT_STARTED, ON_TRACK, AT_RISK, BEHIND, ACHIEVED.

### SCHEMA-04: Initiative FK to KeyResult
Initiative model gains keyResultId (Int, FK to KeyResult). Replaces the existing keyResult String(20) field. Initiative also gains budget (String, optional), resources (String, optional) fields. The existing accountable field is preserved.

### SCHEMA-05: Remove Initiative KPI Fields
Remove from Initiative: kpiTarget, kpiActual, kpiUnit, kpiAutoCalculated, monthlyObjective, weeklyTasks. KPI metrics now live on KeyResult.

### SCHEMA-06: SupportTask Model
New SupportTask model with fields: id (Int, autoincrement), taskId (String, unique, e.g. "ST-001"), category (SupportTaskCategory enum), task (String, description), owner (String), frequency (String, varchar 50 -- too many variations for enum), priority (TaskPriority enum, reuse existing), notes (String, optional). Has many-to-many relation to KeyResult via explicit join table.

### SCHEMA-07: SupportTaskCategory Enum
New enum SupportTaskCategory with 4 values matching Excel categories: DESIGN_CREATIVE, BUSINESS_ADMIN, TALENTA_IDEAS, OPERATIONS.

### SCHEMA-08: SupportTaskKeyResult Join Table
Explicit join table SupportTaskKeyResult (following existing TaskTag pattern) with supportTaskId (FK) and keyResultId (FK), composite unique constraint. Supports the "All KRs" case from Excel (link to all 6 KRs).

---

## SEED: Data Migration

### SEED-01: Wipe Existing Data
Wipe all OKR-related data (initiatives, events, comments on initiatives) using SET FOREIGN_KEY_CHECKS=0 for clean slate. Preserve non-OKR data (companies, projects, etc.) if practical, or full wipe if simpler.

### SEED-02: Parse Key Results Sheet
Parse "Key Results" sheet from MotionVii_SAAP_2026_v2.xlsx. Create 6 KeyResult records with all fields mapped from Excel columns. Validate headers before parsing.

### SEED-03: Parse Initiatives Sheet
Parse "Initiatives" sheet. Create 37 Initiative records linked to KeyResult via FK (match KR reference column to KeyResult.krId). Map new fields: budget, resources, accountable.

### SEED-04: Parse Support Tasks Sheet
Parse "Support Tasks" sheet. Create 30 SupportTask records. Parse comma-separated "supports" column to create SupportTaskKeyResult join records. Handle "All KRs" value by linking to all 6 KeyResults.

### SEED-05: Parse Events Sheet
Parse events data (EventsToAttend) from Excel if present, or preserve existing event seeding.

### SEED-06: Seed Validation Summary
Print summary after seeding: counts of KeyResults, Initiatives, SupportTasks, join links created. Flag any parsing warnings.

---

## API: Endpoints

### API-01: KeyResult CRUD
GET /api/key-results -- list all KRs with initiative counts. GET /api/key-results/[id] -- single KR with initiatives and support tasks. PATCH /api/key-results/[id] -- update actual, progress, status (for manual KR tracking).

### API-02: SupportTask Read
GET /api/support-tasks -- list all support tasks with KR relations. Filter by category query param.

### API-03: Updated Initiative Endpoints
Update existing initiative API routes to include keyResult relation (instead of string). Remove KPI fields from responses. Add budget, resources to create/update.

### API-04: Updated Dashboard Stats
Update dashboard statistics API to compute real revenue from KeyResult actual values (metricType=REVENUE) instead of proxy calculation.

---

## UTIL: Utility Updates

### UTIL-01: Grouping Utilities
Rewrite initiative-group-utils.ts to group by KeyResult relation (keyResult.krId) instead of string field. Query from KR side for natural hierarchy grouping.

### UTIL-02: Remove KPI Utilities
Remove or replace initiative-kpi-utils.ts. KPI aggregation no longer needed at initiative level -- metrics are on KeyResult directly.

### UTIL-03: KR Progress Calculation
Utility function for weighted objective rollup: Objective Progress = Sum(KR_progress_i * KR_weight_i) where weights should sum to 1.0 per objective.

---

## UI-OKR: OKR Hierarchy UI Updates

### UI-OKR-01: KR Row Metrics Display
KeyResult rows in the By Objective view show: description, target, actual, progress bar, unit, status badge, owner, deadline.

### UI-OKR-02: Objective Rollup Progress
Objective headers show weighted rollup progress calculated from child KR weights and progress values.

### UI-OKR-03: Simplified Initiative Rows
Initiative rows no longer show KPI progress bars. Show: title, department, person in charge, status, start/end dates, budget (if present).

### UI-OKR-04: Update Initiative Forms
Initiative create/edit forms: replace free-text keyResult with KeyResult select dropdown (FK). Add budget, resources fields. Remove KPI fields (kpiTarget, kpiActual, kpiUnit).

### UI-OKR-05: Update Initiative Detail
Initiative detail view updated: show linked KeyResult info, budget, resources, accountable. Remove KPI section.

### UI-OKR-06: Update 22-File References
All 22 files that reference initiative.keyResult as string must be updated to use the FK relation. See Pitfalls Appendix A for complete file list.

### UI-OKR-07: Update 8-File KPI References
All 8 files that reference initiative KPI fields must be updated or cleaned. See Pitfalls Appendix B for complete file list.

---

## UI-ST: Support Tasks Page

### UI-ST-01: Support Tasks Page
New page at /support-tasks showing all 30 support tasks grouped by category (4 groups). Each task shows: taskId, task description, owner, frequency, priority, linked KRs as badges.

### UI-ST-02: Category Filtering
Filter support tasks by category. Default shows all categories. Categories: Design & Creative, Business & Admin, Talenta Ideas, Operations.

### UI-ST-03: Navigation Entry
Add "Support Tasks" to sidebar navigation under OKR section.

### UI-ST-04: KR Badge Links
Support task KR badges are clickable, linking to the relevant KR in the objectives view.

---

## UI-REV: Revenue Target Widget

### UI-REV-01: Revenue Target Widget
New dashboard widget showing RM1,000,000 total revenue target with breakdown: Events RM800,000 (80%) and AI Training RM200,000 (20%). Shows actual vs target with progress indication.

### UI-REV-02: Widget Registration
Register revenue-target widget in the widget registry following existing pattern (8 existing widgets). Include role restrictions and default layout position.

---

## CLEAN: Cleanup

### CLEAN-01: Remove Dead Code
After all features built, remove obsolete code: old initiative-kpi-utils.ts functions, any remaining keyResult string references, stale type definitions.

### CLEAN-02: Update Export
Update Excel export API to reflect new columns (remove KPI columns, add budget/resources/accountable, update keyResult to show KR description instead of string code).

### CLEAN-03: Verify File Migration
Verify all 22 keyResult string files and 8 KPI files are fully migrated using the pitfalls appendix checklists.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 46 | Complete |
| SCHEMA-02 | Phase 46 | Complete |
| SCHEMA-03 | Phase 46 | Complete |
| SCHEMA-04 | Phase 46 | Complete |
| SCHEMA-05 | Phase 46 | Complete |
| SCHEMA-06 | Phase 46 | Complete |
| SCHEMA-07 | Phase 46 | Complete |
| SCHEMA-08 | Phase 46 | Complete |
| SEED-01 | Phase 47 | Complete |
| SEED-02 | Phase 47 | Complete |
| SEED-03 | Phase 47 | Complete |
| SEED-04 | Phase 47 | Complete |
| SEED-05 | Phase 47 | Complete |
| SEED-06 | Phase 47 | Complete |
| API-01 | Phase 48 | Pending |
| API-02 | Phase 48 | Pending |
| API-03 | Phase 48 | Pending |
| API-04 | Phase 48 | Pending |
| UTIL-01 | Phase 48 | Pending |
| UTIL-02 | Phase 48 | Pending |
| UTIL-03 | Phase 48 | Pending |
| UI-OKR-01 | Phase 49 | Pending |
| UI-OKR-02 | Phase 49 | Pending |
| UI-OKR-03 | Phase 49 | Pending |
| UI-OKR-04 | Phase 49 | Pending |
| UI-OKR-05 | Phase 49 | Pending |
| UI-OKR-06 | Phase 49 | Pending |
| UI-OKR-07 | Phase 49 | Pending |
| UI-ST-01 | Phase 50 | Pending |
| UI-ST-02 | Phase 50 | Pending |
| UI-ST-03 | Phase 50 | Pending |
| UI-ST-04 | Phase 50 | Pending |
| UI-REV-01 | Phase 51 | Pending |
| UI-REV-02 | Phase 51 | Pending |
| CLEAN-01 | Phase 52 | Pending |
| CLEAN-02 | Phase 52 | Pending |
| CLEAN-03 | Phase 52 | Pending |
