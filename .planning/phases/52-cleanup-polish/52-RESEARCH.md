# Phase 52: Cleanup & Polish - Research

**Researched:** 2026-01-27
**Domain:** Dead code removal, export verification, file migration audit in a Next.js/Prisma codebase
**Confidence:** HIGH (based on exhaustive codebase grep/read of every file in the pitfalls appendices)

## Summary

Phase 52 is a cleanup phase that removes dead code from the v1.5 KPI/string-keyResult system, updates the Excel export, and verifies all file migrations are complete. Research was conducted by reading every file referenced in the pitfalls appendices (Appendix A: 24 keyResult string files, Appendix B: 8 KPI files) and comparing their current state against what Phase 52 requirements demand.

The migration from Phases 46-51 has been largely successful. The keyResult field has been migrated from a string field to a FK relation across all consumer files. Server pages correctly flatten the relation to a string for list/kanban/calendar/timeline views, and the objectives page passes the full KeyResult object. The KPI utils file (`initiative-kpi-utils.ts`) was stubbed in Phase 48 and no component currently imports from it. The export utility was already updated in Phase 48 to use the new data model.

The remaining cleanup work is well-scoped: (1) delete the orphaned `initiative-kpi-utils.ts` file and the orphaned `kpi-progress-bar.tsx` component, (2) update the export Key Result column to show the KR description instead of just the krId code, (3) evaluate whether `resourcesFinancial`/`resourcesNonFinancial` fields should be removed from schema and code, and (4) run the verification audit.

**Primary recommendation:** This is a straightforward deletion and verification phase. No new libraries needed. The main risk is accidentally breaking something by removing code that is still referenced -- mitigate by running TypeScript compilation after each deletion step.

## Standard Stack

No new libraries needed. This phase operates entirely within the existing stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | existing | Type checking after deletions | Catches broken imports immediately |
| Prisma | existing | Schema field cleanup (if removing old fields) | Already the ORM in use |
| xlsx | existing | Export utility updates | Already used for Excel export |

### Supporting
None needed.

## Architecture Patterns

### Recommended Approach: Delete-Verify-Commit Cycle

**What:** For each dead code item, delete the code, run `npx tsc --noEmit` to verify no broken references, then commit. Do NOT batch all deletions into a single commit.

**When to use:** Every deletion step in this phase.

**Why:** A single broken import from a missed reference could cascade into a confusing error. Incremental verification catches problems at the smallest possible scope.

```
Step 1: Delete file/code
Step 2: npx tsc --noEmit
Step 3: Fix any errors found
Step 4: git commit
Step 5: Next deletion
```

### Pattern: Export Column Update

**What:** Modify `initiative-export-utils.ts` to change the Key Result column value from `initiative.keyResult?.krId || '-'` to include the description per CLEAN-02: "update keyResult to show KR description instead of string code."

**Current code (line 108):**
```typescript
'Key Result': initiative.keyResult?.krId || '-',
```

**Updated code should be:**
```typescript
'Key Result': initiative.keyResult
  ? `${initiative.keyResult.krId} - ${initiative.keyResult.description}`
  : '-',
```

The `InitiativeForExport` interface already includes `description` in the keyResult type (line 38). The export API route already selects `krId` and `description` (line 27). So only the mapping line needs to change.

### Anti-Patterns to Avoid
- **Batch all deletions without verifying:** Run `tsc --noEmit` after each deletion, not at the end.
- **Removing schema fields without checking all Prisma queries:** If removing `resourcesFinancial`/`resourcesNonFinancial`, grep for ALL references first.
- **Assuming the pitfalls appendix is current:** The appendix was written before Phases 46-51. Some files have been restructured. Use the actual codebase state, not the appendix line numbers.

## Dead Code Inventory (CLEAN-01)

Exhaustive analysis of what is dead and what is still used.

### Confirmed Dead: Safe to Delete

| File | Status | Evidence |
|------|--------|----------|
| `src/lib/initiative-kpi-utils.ts` | ORPHAN -- zero imports anywhere in codebase | Grep for "initiative-kpi-utils" and "initiative-kpi" returns 0 hits outside the file itself. The `@deprecated` header says "Remove in Phase 52." |
| `src/components/objectives/kpi-progress-bar.tsx` | ORPHAN -- zero imports anywhere in codebase | Grep for "KpiProgressBar" and "kpi-progress-bar" returns only the file's own definition. No component imports it. |

### Confirmed Migrated: Old Pattern Replaced, No Action Needed

These files from Appendix A used to reference `keyResult` as a string. They have all been updated:

| # | File | Current State |
|---|------|---------------|
| 1 | `prisma/schema.prisma` | keyResult is a FK relation (line 59-60). No string keyResult field exists. |
| 2 | `prisma/seed.ts` | Seeds keyResultId FK. No string keyResult. |
| 3 | `src/app/api/initiatives/route.ts` | POST uses `body.keyResultId`. GET includes `keyResult: { select: ... }`. |
| 4 | `src/app/api/initiatives/[id]/route.ts` | PUT uses `body.keyResultId`. GET includes `keyResult: true`. |
| 5 | `src/app/api/initiatives/export/route.ts` | Selects `keyResult: { select: { krId: true, description: true } }`. |
| 6 | `src/lib/initiative-group-utils.ts` | Groups by `keyResultId` FK + `keyResult?.krId`. No `normalizeKeyResult()` function. |
| 7 | `src/lib/initiative-export-utils.ts` | Uses `keyResult: { krId, description } | null`. Maps `initiative.keyResult?.krId`. |
| 8 | `src/app/(dashboard)/objectives/page.tsx` | Selects full KR relation with target/actual/progress/weight. Serializes to numbered values. |
| 9 | `src/app/(dashboard)/kanban/page.tsx` | Flattens `i.keyResult?.krId \|\| 'Unlinked'` to string at server layer. |
| 10 | `src/app/(dashboard)/calendar/page.tsx` | Flattens `i.keyResult?.krId \|\| 'Unlinked'` to string at server layer. |
| 11 | `src/app/(dashboard)/timeline/page.tsx` | Flattens `i.keyResult?.krId \|\| 'Unlinked'` to string at server layer. |
| 12 | `src/components/objectives/objective-hierarchy.tsx` | Uses `KeyResultData` interface with full KR fields. `keyResult: KeyResultData \| null`. |
| 13 | `src/components/objectives/key-result-group.tsx` | Uses `GroupedKeyResult` from group-utils. Accesses KR metrics via `initiative.keyResult`. |
| 14 | `src/components/objectives/objective-group.tsx` | Uses `calculateObjectiveProgress()` from `kr-progress-utils.ts`. No KPI references. |
| 15 | `src/components/initiatives/initiative-form.tsx` | Uses `keyResultId` (string FK). Has `<Select>` dropdown populated from `/api/key-results`. |
| 16 | `src/components/initiatives/initiatives-list.tsx` | Receives `keyResult: string` (flattened by server). Searches/filters on it as string. |
| 17 | `src/components/initiatives/initiative-detail.tsx` | Uses `keyResult?: { id, krId, description } \| null`. Displays `krId - description`. |
| 18 | `src/components/kanban/initiative-detail-sheet.tsx` | Union type `keyResult: string \| { krId: string } \| null`. Handles both contexts. |
| 19 | `src/components/kanban/kanban-board.tsx` | `keyResult: string` in Initiative type. Receives flattened string. |
| 20 | `src/components/kanban/kanban-filter-bar.tsx` | `keyResults: string[]` prop. Works with flattened strings. |
| 21 | `src/components/kanban/kanban-card.tsx` | `keyResult: string` in Initiative type. Displays as-is. |
| 22 | `src/components/kanban/kanban-swimlane-view.tsx` | `keyResult: string` in Initiative type. Groups by string. |
| 23 | `src/components/timeline/gantt-chart.tsx` | `keyResult: string` in Initiative type. Displays as label. |
| 24 | `src/components/calendar/calendar-view.tsx` | `keyResult: string` in Initiative type. Used in display. |

### Confirmed Migrated: Appendix B (KPI Files)

| # | File | Current State |
|---|------|---------------|
| 1 | `src/lib/initiative-kpi-utils.ts` | DEAD -- orphan file, zero imports. **Delete.** |
| 2 | `src/lib/initiative-export-utils.ts` | Already updated to v2.0 model. No KPI column references. |
| 3 | `src/components/objectives/key-result-group.tsx` | No `aggregateKpiTotals` import. Uses direct KR metrics. |
| 4 | `src/components/objectives/initiative-row.tsx` | No `calculateKpi` import. No KpiProgressBar usage. |
| 5 | `src/components/objectives/objective-hierarchy.tsx` | No KPI fields in Initiative interface. Uses `KeyResultData`. |
| 6 | `src/components/kanban/initiative-detail-sheet.tsx` | No KPI state, no KPI Tracking section. Clean. |
| 7 | `src/app/(dashboard)/objectives/page.tsx` | No KPI fields in Prisma select. Selects KR metrics instead. |
| 8 | `src/app/api/initiatives/[id]/route.ts` | No KPI fields in include/select. No KPI PATCH handling. |

### Deferred Decision: resourcesFinancial/resourcesNonFinancial

**Schema fields (still in schema.prisma, lines 50-51):**
```prisma
resourcesFinancial    Decimal?             @db.Decimal(12, 2)
resourcesNonFinancial String?              @db.Text
```

**Code references that still use these old fields:**
| File | Lines | Usage |
|------|-------|-------|
| `src/app/(dashboard)/initiatives/page.tsx` | 24 | `resourcesFinancial: i.resourcesFinancial ? Number(i.resourcesFinancial) : null` |
| `src/app/(dashboard)/initiatives/[id]/page.tsx` | 41-42 | Serializes `resourcesFinancial` to Number |
| `src/components/initiatives/initiative-detail.tsx` | 73-74 | `resourcesFinancial: number \| null`, `resourcesNonFinancial: string \| null` in interface |
| `src/components/initiatives/initiative-form.tsx` | 40-41 | Optional in interface: `resourcesFinancial?: number \| null`, `resourcesNonFinancial?: string \| null` |
| `src/app/api/initiatives/route.ts` | 87-88 | POST writes `resourcesFinancial` and `resourcesNonFinancial` |
| `src/app/api/initiatives/[id]/route.ts` | 101-102 | PUT writes `resourcesFinancial` and `resourcesNonFinancial` |

**Decision context:** Phase 46-01 explicitly deferred this: "Kept resourcesFinancial/resourcesNonFinancial alongside new budget/resources." The new `budget` (String) and `resources` (String) fields have replaced these functionally. However:

- `resourcesFinancial` (Decimal) has a more structured format than `budget` (String).
- No UI currently displays `resourcesFinancial` or `resourcesNonFinancial` to users -- they are serialized in page server components but the detail view shows `budget` and `resources` instead.
- The form still sends both sets of fields (old and new) to the API.

**Recommendation:** Remove `resourcesFinancial` and `resourcesNonFinancial` from:
1. The Prisma schema
2. Both API routes (POST/PUT)
3. Both page server components (initiatives list + detail page)
4. The `initiative-form.tsx` interface
5. The `initiative-detail.tsx` interface

This requires running `prisma db push` afterward to drop the columns. This is safe because:
- The seed script (Phase 47) does not seed these fields
- The new `budget`/`resources` fields are the active replacement
- No UI displays the old field values

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-safe deletion verification | Manual grep | `npx tsc --noEmit` | Compiler catches ALL broken references, including transitive ones |
| File impact discovery | Manual reading | `grep -r "pattern" src/` | Already done in this research; the dead code inventory above is exhaustive |
| Export column layout verification | Manual XLSX inspection | Download and open the export file | Visual confirmation is the only way to verify column order and content |

## Common Pitfalls

### Pitfall 1: Deleting a File That Is Still Dynamically Imported
**What goes wrong:** A file is deleted but some component uses a dynamic `import()` or lazy load that TypeScript can't statically verify.
**Why it happens:** `tsc --noEmit` catches static imports but not dynamic ones.
**How to avoid:** After each deletion, also run `npm run build` (Next.js build) which catches both static and dynamic import issues through its bundler. At minimum, grep for the filename/export name before deleting.
**Warning signs:** Build succeeds but runtime error appears on page load.

### Pitfall 2: Schema Field Removal Without db push
**What goes wrong:** Fields are removed from `schema.prisma` and code, but `prisma db push` is not run. The Prisma client still works (it only selects fields it knows about), but the columns remain in the database, wasting space and creating confusion.
**Why it happens:** `prisma generate` updates the client, but doesn't touch the database.
**How to avoid:** After removing fields from schema, run `npx prisma db push` AND `npx prisma generate`.
**Warning signs:** `DESCRIBE initiatives` in the database still shows old columns.

### Pitfall 3: Export Column Count Mismatch with Requirements
**What goes wrong:** CLEAN-02 says "remove KPI columns, add budget/resources/accountable." But Phase 48-02 already did this. If Phase 52 tries to do it again, the export breaks.
**Why it happens:** The requirements were written before Phase 48 executed the export update.
**How to avoid:** Verify current export state before making changes. The export already has 17 columns (not 20). The only remaining CLEAN-02 change is updating the Key Result column to show description.
**Warning signs:** Export produces wrong number of columns or duplicate columns.

### Pitfall 4: Removing kpi-progress-bar.tsx Breaks Future Feature
**What goes wrong:** `kpi-progress-bar.tsx` is a generic progress bar component that could be reused.
**Why it happens:** The component has "KPI" in the name but is actually a generic progress visualization.
**How to avoid:** Check if the component's functionality is truly unique. In this case, the objectives page now uses the `<Progress>` shadcn/ui component directly (see `key-result-group.tsx` lines 98-101 and `objective-group.tsx` lines 88-91). The `KpiProgressBar` component is genuinely unused and redundant.
**Warning signs:** None -- safe to delete.

## Export Analysis (CLEAN-02)

### Current Export State (Phase 48 update already applied)

The export currently has 17 columns:

| # | Header | Source |
|---|--------|--------|
| 1 | # | sequenceNumber |
| 2 | Objective | objective (formatted) |
| 3 | Key Result | `keyResult?.krId \|\| '-'` |
| 4 | Title | title |
| 5 | Department | department (formatted) |
| 6 | Status | status (formatted) |
| 7 | Owner | personInCharge (formatted) |
| 8 | Accountable | accountable (formatted) |
| 9 | Start Date | startDate (formatted) |
| 10 | End Date | endDate (formatted) |
| 11 | Duration | calculated days |
| 12 | Budget | budget |
| 13 | Resources | resources |
| 14 | Linked Projects | project count |
| 15 | Total Revenue | sum of project revenues |
| 16 | Total Costs | sum of project costs |
| 17 | Remarks | remarks |

### Required Change (CLEAN-02)

Only one change is needed: Column 3 "Key Result" currently shows just the krId code (e.g., "KR1.1"). The requirement says "update keyResult to show KR description instead of string code."

**Recommended approach:** Show both code and description: `"KR1.1 - Drive revenue through events"`. This is more informative than just the description alone, and the `InitiativeForExport` type already includes both fields.

**No structural changes needed** -- the column count stays at 17, the column order stays the same. Budget/resources/accountable columns are already present (added in Phase 48-02).

## Verification Checklist (CLEAN-03)

### Appendix A: keyResult String-to-FK Migration Status

All 24 files have been verified. Status:

- **Schema/API (5 files):** All migrated. Using `keyResultId` FK and `keyResult` relation.
- **Utility/Logic (2 files):** All migrated. `initiative-group-utils.ts` uses FK-based grouping. `initiative-export-utils.ts` uses relation type.
- **Page Server Components (4 files):** All migrated. Objectives passes full object; kanban/calendar/timeline flatten to string at server layer.
- **UI Components (13 files):** All migrated. Objectives components use full `KeyResultData` object. List/kanban/calendar/timeline components receive flattened string. Detail views handle both via union type.

**Files NOT in original appendix but also migrated:**
- `src/app/(dashboard)/initiatives/page.tsx` -- Flattens keyResult to string
- `src/app/(dashboard)/initiatives/[id]/page.tsx` -- Passes keyResult relation as-is
- `src/components/initiatives/initiative-detail.tsx` -- Uses `{ id, krId, description }` object

### Appendix B: KPI Field Removal Status

All 8 files verified. No remaining references to initiative-level KPI fields (`kpiLabel`, `kpiTarget`, `kpiActual`, `kpiUnit`, `kpiManualOverride`).

The only remaining artifacts are:
1. `initiative-kpi-utils.ts` (dead file, zero imports) -- **Delete**
2. `kpi-progress-bar.tsx` (dead component, zero imports) -- **Delete**

## Code Examples

### Deleting initiative-kpi-utils.ts

```bash
# Step 1: Verify no imports
grep -r "initiative-kpi-utils" src/  # Should return 0 results
grep -r "calculateKpi\|aggregateKpiTotals\|KpiResult\|AggregatedKpi" src/ --include="*.ts" --include="*.tsx"  # Only hits in the file itself

# Step 2: Delete
rm src/lib/initiative-kpi-utils.ts

# Step 3: Verify
npx tsc --noEmit  # Should pass clean
```

### Deleting kpi-progress-bar.tsx

```bash
# Step 1: Verify no imports
grep -r "KpiProgressBar\|kpi-progress-bar" src/  # Only hits in the file itself

# Step 2: Delete
rm src/components/objectives/kpi-progress-bar.tsx

# Step 3: Verify
npx tsc --noEmit  # Should pass clean
```

### Updating Export Key Result Column

```typescript
// src/lib/initiative-export-utils.ts, line 108
// Before:
'Key Result': initiative.keyResult?.krId || '-',

// After:
'Key Result': initiative.keyResult
  ? `${initiative.keyResult.krId} - ${initiative.keyResult.description}`
  : '-',
```

### Removing resourcesFinancial/resourcesNonFinancial (if decided)

```prisma
// prisma/schema.prisma -- Remove these two lines:
// resourcesFinancial    Decimal?             @db.Decimal(12, 2)
// resourcesNonFinancial String?              @db.Text
```

Then update 6 TypeScript files to remove references (listed in Dead Code Inventory above).

## State of the Art

| Old Approach (v1.5) | Current Approach (v2.0) | When Changed | Impact on Cleanup |
|---------------------|-------------------------|--------------|-------------------|
| `keyResult: String @db.VarChar(20)` on Initiative | `keyResultId FK -> KeyResult model` | Phase 46 | All string refs migrated; verify only |
| `kpiLabel/kpiTarget/kpiActual/kpiUnit/kpiManualOverride` on Initiative | `target/actual/progress/unit` on KeyResult | Phase 46 | KPI utils file is dead; delete it |
| `initiative-kpi-utils.ts` (calculateKpi, aggregateKpiTotals) | `kr-progress-utils.ts` (calculateObjectiveProgress) | Phase 48 | Old file orphaned; delete it |
| `KpiProgressBar` component | Direct `<Progress>` from shadcn/ui | Phase 49 | Component orphaned; delete it |
| Export with 20 columns (7 KPI + string keyResult) | Export with 17 columns (no KPI, FK-based keyResult) | Phase 48 | Only need to update krId -> description |
| `resourcesFinancial (Decimal)` + `resourcesNonFinancial (String)` | `budget (String)` + `resources (String)` | Phase 46 | Old fields still in schema; evaluate removal |

## Open Questions

1. **Should `resourcesFinancial`/`resourcesNonFinancial` be removed from the schema?**
   - What we know: These fields were explicitly deferred to Phase 52. They are NOT used in any UI display. They ARE still referenced in page server serialization and API write paths. The seed script does NOT populate them.
   - What's unclear: Whether the user wants to keep them as a safety net or remove them cleanly.
   - Recommendation: Remove them. The `budget` and `resources` String fields are the canonical replacement. Include `prisma db push` as part of the cleanup.

2. **Should the export Key Result column show just description, or krId + description?**
   - What we know: CLEAN-02 says "update keyResult to show KR description instead of string code." This could mean replacing krId entirely with description, or combining both.
   - Recommendation: Use `"KR1.1 - Drive revenue through events"` format (code + description). The code provides quick reference; the description provides context. The column width (wch: 10) should be increased to accommodate longer text (suggest wch: 40).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all 32 files from Pitfalls Appendix A + B
- `prisma/schema.prisma` -- current model definitions
- `src/lib/initiative-kpi-utils.ts` -- confirmed @deprecated, zero imports
- `src/components/objectives/kpi-progress-bar.tsx` -- confirmed zero imports
- `src/lib/initiative-export-utils.ts` -- current export column definitions

### Secondary (MEDIUM confidence)
- `.planning/research/v2.0-PITFALLS.md` -- original file impact lists (some line numbers stale but file list is accurate)
- `.planning/phases/48-api-layer-utilities/48-VERIFICATION.md` -- confirms KPI stubs were intentional

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Dead code inventory: HIGH -- every file read and verified via grep
- Export analysis: HIGH -- current code read, requirement compared
- File migration audit: HIGH -- all 32 files from appendices verified
- resourcesFinancial removal: MEDIUM -- safe to remove but user confirmation recommended

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable; no external dependencies or version changes)
