# Pitfalls Research: Initiative Intelligence & Export (v1.5)

**Domain:** OKR/Initiative Management with KPI Tracking, Date Intelligence & Excel Export
**Project:** SAAP 2026 v2
**Context:** Adding objective hierarchy views, KPI metrics, date analysis, and Excel export to existing Next.js 14 app (~34K LOC) deployed on NAS. 28 initiatives, 2 objectives, ~8 key results, ~50 projects.
**Researched:** 2026-01-26
**Confidence:** HIGH (verified against codebase analysis, existing schema, and domain research)

---

## Critical Pitfalls

Mistakes that cause rewrites or major architectural issues.

### Pitfall 1: Free-Text keyResult Grouping Fragility

**What goes wrong:** The `keyResult` field is a free-text `VarChar(20)` input, not an enum or normalized lookup. Grouping initiatives by key result for the Objective -> KR -> Initiative hierarchy will produce fragile, inconsistent groups if users type slightly different values (e.g., "KR1.1" vs "KR 1.1" vs "KR1.1 " vs "kr1.1").

**Why it happens:** The original Excel import populated keyResult from a spreadsheet column with consistent values. But the initiative form (`initiative-form.tsx` line 128-135) is a plain `<Input>` with no validation, no autocomplete, and placeholder "e.g., KR1.1". Users can type anything up to 20 characters. Over time, inconsistencies accumulate. Research shows free-text fields produce redundant data -- "expressing the same thing in multiple ways" (e.g., "India" vs "Bharat" vs "IND") which is more problematic than duplicate data and harder to fix.

**How to avoid:**
1. **Best approach:** Create a `KeyResult` lookup table or enum mapping that defines the canonical KR identifiers per objective. Replace the free-text input with a Select/ComboBox constrained to known values. This is a schema change but prevents the problem entirely.
2. **Pragmatic approach (recommended for v1.5):** Keep VarChar(20) but add a normalized grouping strategy. When building the hierarchy view, normalize keyResult values for grouping: trim whitespace, uppercase, strip periods/spaces. Add a ComboBox (not free Input) that shows existing keyResult values as suggestions while allowing new values. This avoids schema migration while preventing most inconsistencies.
3. **Minimum viable:** Normalize on read only -- `keyResult.trim().toUpperCase()` -- and accept that some manual cleanup may be needed.

**Warning signs:**
- Hierarchy view shows duplicate KR groups (e.g., "KR1.1" and "KR 1.1" as separate rows)
- Initiative count under objectives does not match total count
- Users report "my initiative is under the wrong key result"

**Phase to address:** Phase 1 (By Objective view). Must decide on grouping strategy before building the hierarchy component.

---

### Pitfall 2: KPI Auto-Calculation Edge Cases with Null/Zero/Missing Data

**What goes wrong:** Auto-calculating KPI metrics (target vs actual) from linked projects breaks when initiatives have no linked projects, projects have null revenue, or target values are zero. Division-by-zero errors, misleading percentages, and NaN values appear in the UI.

**Why it happens:** The calculation chain is: Initiative -> Projects (via `initiativeId`) -> Sum(revenue) and Sum(costs). But:
- Many initiatives have 0 linked projects (most of the 28 likely have no projects yet)
- Projects may have `null` revenue (only populated via AI invoice import)
- Projects may have `null` potentialRevenue
- The target value for a KPI could be zero or unset
- Percentage calculations like `(actual / target) * 100` fail when target is 0

Research from KPI tools confirms: "Zero is going to be tough if it's the TARGET because so many formulas divide by the Target." Power BI KPI Matrix displays blank when target value is zero. Standard score formulas (Reduction, Absolute, Deviation) all divide by the Target.

**How to avoid:**
1. Define explicit null-handling rules before writing any calculation logic:
   - No linked projects -> Show "No data" or "0 / [target]", not "0%"
   - Null revenue -> Treat as 0 for summing, but distinguish "no data" from "actually zero"
   - Zero target -> Show absolute value only (actual - target), never divide
   - All nulls -> Show "Not configured" state, not broken percentages
2. Use `Decimal` type math throughout (already in Prisma schema), convert to Number only at display
3. Provide manual override that takes precedence over auto-calculation, with visual indicator showing "manual" vs "calculated"
4. Never show `NaN`, `Infinity`, or `-Infinity` in UI -- guard every division

**Warning signs:**
- KPI cards showing "NaN%" or "Infinity%"
- Revenue showing RM 0.00 when it should show "No data"
- Progress bars at 0% for initiatives that are genuinely progressing but have no linked projects
- Manual override values being overwritten by auto-calculation

**Phase to address:** Phase 3 (KPI metrics). Design the calculation model and null-handling rules before any UI work.

---

### Pitfall 3: Tight Coupling Between View Mode and Data Fetching

**What goes wrong:** Building the "By Objective" view as a separate page with its own data fetching creates duplicate data loading logic, inconsistent state between views, and confusing navigation. Users switching between list/kanban/timeline/objective views see different data because each view fetches independently.

**Why it happens:** The existing initiatives page (`/initiatives/page.tsx`) fetches flat initiative data. The natural impulse is to create a new page (`/initiatives/by-objective/page.tsx`) with a more complex query that includes projects. This leads to separate data sources, separate filter logic, and separate refresh mechanisms.

**How to avoid:**
1. **Shared data layer:** The initiatives list page should fetch ALL data needed by any view mode (initiatives with projects included). The "By Objective" view is a different rendering of the same data, not a different page.
2. **View mode as state, not route:** Use a tab/toggle component on the existing initiatives page. Store view preference in local state or URL params (`?view=objective`), not as separate routes.
3. **Include projects in the initiatives API response:** Extend the existing `/api/initiatives` endpoint to include linked projects when needed (`?include=projects`), rather than creating a new endpoint.

**Warning signs:**
- Creating `/initiatives/by-objective/page.tsx` as a separate page
- Duplicating filter logic across view components
- Users see different initiative counts in different views
- Switching views causes full page reload

**Phase to address:** Phase 1 (By Objective view). Architecture decision must be made upfront.

---

### Pitfall 4: SheetJS (xlsx) npm Package Is Outdated and Vulnerable

**What goes wrong:** The project already has `"xlsx": "^0.18.5"` in dependencies (used by seed script). This version from the npm public registry is 2+ years old and has a high-severity vulnerability. Using it for the Excel export feature exposes the app to security issues and limits functionality.

**Why it happens:** SheetJS stopped publishing to the npm public registry after version 0.18.5. The current version (available from their CDN/website) is significantly newer. Developers who run `npm install xlsx` unknowingly get the outdated, vulnerable version.

**How to avoid:**
1. **Recommended: Use ExcelJS instead.** ExcelJS (`exceljs` on npm) is actively maintained, has a straightforward API, works well with Next.js Route Handlers via `workbook.xlsx.writeBuffer()`, and does not have the registry versioning problem. It also supports streaming for large files (not needed for 28 initiatives, but future-proof).
2. **If keeping SheetJS:** Install from the official source, not npm: `npm install --save https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`. But this complicates CI/CD and Docker builds.
3. **Regardless:** Remove or isolate the existing `xlsx` dependency to the seed script only. Do not use it for new export functionality.

**Warning signs:**
- `npm audit` showing high-severity vulnerability in `xlsx`
- Excel export producing corrupted files
- Missing features in generated Excel files (styling, merged cells)
- Build warnings about deprecated APIs

**Phase to address:** Phase 5 (Excel export). Choose library before implementation. Consider removing xlsx dependency from main project and using ExcelJS for export.

---

## Moderate Pitfalls

Mistakes that cause delays, bugs, or technical debt.

### Pitfall 5: Tree View Performance with Expand/Collapse State Management

**What goes wrong:** The Objective -> KR -> Initiative hierarchy view re-renders the entire tree when any node is expanded/collapsed. For 28 initiatives grouped under 2 objectives and ~8 KRs, performance is fine now, but state management bugs emerge: expand state resets on data refresh, all nodes collapse when a single initiative is updated, or expand state conflicts between views.

**Why it happens:** Naive implementation stores expand state inside the tree component. When parent re-renders (e.g., after an initiative status update triggering data refresh), expand state is lost. The existing TaskTree component already solved this -- "Expand state in parent TaskTree: Preserves state across data refreshes" (from Key Decisions) -- but the pattern may not be replicated.

**How to avoid:**
1. Follow the existing TaskTree pattern: store expand state in the parent component, pass down as props
2. Use stable IDs for tree nodes (objective enum + keyResult string, not array indices)
3. Default to all expanded (only 2 objectives, ~8 KRs -- everything visible is better for 28 items)
4. Persist expand state in URL params or localStorage for session continuity

**Warning signs:**
- Tree collapses to top level after editing an initiative
- Expand/collapse feels "laggy" despite small data set
- React DevTools showing full tree re-render on single node toggle

**Phase to address:** Phase 1 (By Objective view). Use the same pattern proven in TaskTree.

---

### Pitfall 6: Date Intelligence Threshold Arbitrariness

**What goes wrong:** "Flag too-long durations" requires defining what "too long" means. Picking arbitrary thresholds (e.g., >90 days = warning) leads to:
- Most initiatives flagged (making warnings useless)
- Or no initiatives flagged (thresholds too lenient)
- Team ignoring warnings because they feel random

**Why it happens:** Without domain context, developers pick round numbers. But the 28 initiatives span a fiscal year -- some are genuinely 6-12 month efforts, others should be 2-4 weeks. A one-size-fits-all threshold does not work.

**How to avoid:**
1. **Analyze actual data first:** Query the existing 28 initiatives to find the distribution of durations. Calculate median, P75, P90. Use data-driven thresholds.
2. **Use relative thresholds, not absolute:** Flag initiatives whose duration is >2x the median for their objective, or >P90 across all initiatives.
3. **Make thresholds configurable:** Store duration warning thresholds as admin settings. Start with a reasonable default based on data analysis, allow admin to adjust.
4. **Graduated severity:** Instead of binary warn/ok, use tiers: "normal", "long" (>P75), "very long" (>P90), with different visual indicators.
5. **Date validation is more clear-cut:** endDate before startDate is always wrong. Dates outside 2026 fiscal year are likely wrong. These are binary validations, not threshold-based.

**Warning signs:**
- "All 28 initiatives are flagged as too long" -- threshold too aggressive
- "No initiatives flagged" -- threshold too lenient
- Team asks "why is this flagged?" with no good answer
- Hardcoded threshold constants scattered in code

**Phase to address:** Phase 4 (Date Intelligence). Research actual data distribution before choosing thresholds.

---

### Pitfall 7: Excel Export on Server vs Client -- Wrong Choice for NAS

**What goes wrong:** Generating Excel files server-side on a NAS with low CPU priority (`nice -n 19`) could cause request timeouts or block the event loop. But generating client-side has its own issues (browser compatibility, memory).

**Why it happens:** Server-side is the "proper" way for large exports. But the NAS deployment constraint (low resources) means even moderate CPU work is slow. For 28 initiatives, this is not actually a problem -- but the implementation choice affects future scalability and code architecture.

**How to avoid:**
1. **Server-side via API Route (recommended for 28 initiatives):** The data set is tiny. ExcelJS can generate a workbook with 28 rows + headers in milliseconds. Even on a NAS with `nice -n 19`, this completes in <100ms. Server-side is correct for this scale.
2. **Pattern:** Create `/api/initiatives/export` route that:
   - Queries all initiatives with included projects
   - Creates ExcelJS workbook with `writeBuffer()`
   - Returns `new Response(buffer, { headers })` with Content-Disposition
3. **Do NOT use streaming** for this data size. The overhead of streaming setup exceeds the benefit for 28 rows.
4. **Include proper headers:** `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="SAAP_Initiatives_2026.xlsx"`

**Warning signs:**
- Export taking >2 seconds on NAS (something is wrong at 28 rows)
- Client-side approach requiring complex Blob/FileSaver polyfills
- Export endpoint blocking other requests

**Phase to address:** Phase 5 (Excel export). Implementation is straightforward if library choice is made early.

---

### Pitfall 8: Linked Project Inline Display -- N+1 Query or Over-fetching

**What goes wrong:** Showing linked project status inline for each initiative either causes N+1 queries (one query per initiative to fetch projects) or over-fetches by including full project data for all initiatives on every page load.

**Why it happens:** Each initiative can have 0-N linked projects (via `initiativeId` FK on Project). The hierarchy view needs to show project status, revenue, and costs for each initiative. Naive implementation fetches projects separately or includes too much data.

**How to avoid:**
1. **Single query with Prisma include:** Fetch initiatives with `include: { projects: { select: { id, title, status, revenue, potentialRevenue } } }` in one query. Prisma handles the JOIN.
2. **Aggregate costs server-side:** Projects have a `costs` relation. Rather than including all costs, compute the sum server-side: use `projects: { include: { _count: true, costs: true } }` or better, compute in a raw query or application code.
3. **Consider a summary endpoint:** For the hierarchy view, create a dedicated API endpoint that returns initiatives pre-aggregated with project summaries. This is better than trying to fit everything into the existing flat initiatives endpoint.
4. **Cache project summaries:** Since project data changes less frequently than initiatives view is loaded, consider computing summaries on project update and storing them, rather than computing on every page load.

**Warning signs:**
- Network tab showing 28+ requests on page load (N+1)
- Initiatives API response >100KB (over-fetching)
- Page load time >2 seconds despite small data set
- `_count` queries running for each initiative separately

**Phase to address:** Phase 2 (Linked projects). Design the data fetching strategy alongside the hierarchy view.

---

### Pitfall 9: Manual KPI Override Being Silently Overwritten

**What goes wrong:** User manually sets a KPI target/actual value for an initiative, then the auto-calculation runs (triggered by a project update) and overwrites the manual value without warning.

**Why it happens:** Two data sources competing for the same field. Auto-calculation from linked projects runs on project save/update. Manual override is a direct edit. Without clear precedence rules, the last write wins -- and auto-calculation typically runs more frequently.

**How to avoid:**
1. **Separate fields:** Store `calculatedValue` and `manualOverride` separately. Display `manualOverride ?? calculatedValue`.
2. **Override flag:** Add a boolean `isManualOverride` per KPI field. When true, auto-calculation skips that field. Show a visual indicator (e.g., pencil icon) for manually overridden values.
3. **Show both:** Display calculated value alongside manual override. "Auto: RM 50,000 | Override: RM 45,000" -- lets user see drift and decide.
4. **Audit trail:** When auto-calculation detects a difference from the manual override, log it but do not overwrite.

**Warning signs:**
- "I set the target to 50K but it keeps resetting to 0"
- KPI values changing without user action
- No way to tell if a value is calculated or manual

**Phase to address:** Phase 3 (KPI metrics). Data model must distinguish manual from calculated before building UI.

---

### Pitfall 10: Timeline Overlap Detection Ambiguity

**What goes wrong:** "Detect timeline overlaps" sounds simple but has ambiguous semantics. What constitutes an overlap? Two initiatives under the same KR with overlapping dates? Same person assigned to overlapping initiatives? Same department? All of these produce different results and different UX.

**Why it happens:** "Overlap" is not defined precisely in the requirements. Without clear scoping, the feature either flags everything (useless) or the wrong things (confusing).

**How to avoid:**
1. **Define overlap scope explicitly before coding:**
   - **Same person overlap:** Initiatives where the same `personInCharge` has overlapping date ranges. This is the most actionable -- it means someone is double-booked.
   - **Same KR overlap:** Multiple initiatives under the same key result with overlapping dates. This may be intentional (parallel workstreams) or a planning error.
   - **Capacity overlap:** Same person with >3 concurrent initiatives. This is resource overloading.
2. **Start with person overlap only.** It is the most concrete, most actionable, and least ambiguous. Other overlap types can be added incrementally.
3. **Visual approach:** Show overlaps in the existing Gantt timeline view using color coding or connecting lines, not as a separate alert system.

**Warning signs:**
- "Everything is overlapping" -- scope too broad
- Feature built but nobody uses it -- not actionable
- Complex overlap algorithm that takes significant development time

**Phase to address:** Phase 4 (Date Intelligence). Define overlap semantics during planning, not during implementation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded KR grouping labels | Faster to build hierarchy | New key results require code changes | Acceptable for v1.5 if KRs are stable (they are -- sourced from Excel SAAP) |
| Computing aggregates client-side | No API changes needed | Slow on mobile, inconsistent calculations | Never -- always aggregate server-side for financial data |
| Storing KPI in initiative table directly | No new table needed | Manual/calculated distinction impossible | Only if no manual override requirement |
| Using `xlsx` (0.18.5) for export | Already installed, zero setup | Vulnerable dependency, limited features | Only for seed script (already the case); NOT for user-facing export |
| Inline threshold constants | Quick to implement | Changing requires code change + deploy | Acceptable for initial launch; make configurable in v1.6 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries for project summaries | Slow page load, many DB queries | Use Prisma `include` with `select` for single query | Immediately if not caught, but masked by small dataset |
| Full project data in initiative list | Large JSON payloads, slow parse | Select only needed fields (id, title, status, revenue) | When projects accumulate documents/costs |
| Re-rendering entire tree on expand toggle | Jank during expand/collapse | Memoize tree nodes, stable keys, state in parent | With very deep hierarchies (not a risk at 2 obj + 8 KR) |
| Excel generation on every click | Server CPU spike, slow response | Cache generated file for 5 minutes, or debounce | Not a real risk at 28 rows; matters if data grows to 100+ |
| Computing date overlaps on every render | Expensive O(n^2) comparison | Compute once on data load, memoize results | At 28 initiatives, O(n^2) = 784 comparisons -- not actually slow |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Hierarchy view collapses completely on data refresh | User loses context, must re-expand | Persist expand state across refreshes (proven pattern in TaskTree) |
| KPI progress showing 0% for initiatives with no projects | Feels like initiative is failing when it just has no data | Show "No linked projects" or empty state, not 0% |
| Date warnings as blocking alerts | Interrupts workflow, trains users to dismiss | Non-blocking inline indicators (colored badges, subtle icons) |
| Export button with no progress feedback | User clicks repeatedly thinking nothing happened | Show loading spinner, disable button during generation |
| View switcher hidden in navigation | Users do not discover the "By Objective" view | Make it a prominent tab on the initiatives page, default to objective view |
| Too much information in hierarchy rows | Overwhelming, defeats the purpose of hierarchical organization | Show summary (title, status badge, project count) in hierarchy; details in the existing detail modal |
| Overlap warnings without context | "Initiatives 5 and 12 overlap" -- user has no idea what to do | Show overlap with person/KR context and visual timeline indicator |

---

## "Looks Done But Isn't" Checklist

Before considering each feature complete:

**By Objective View:**
- [ ] keyResult grouping handles whitespace/case variations
- [ ] Empty KR groups (all initiatives completed/cancelled) still show
- [ ] Objective totals match flat list totals
- [ ] Expand/collapse state preserved on data refresh
- [ ] Mobile responsive (accordion on small screens)
- [ ] View preference persists across page navigations

**KPI Metrics:**
- [ ] Zero target handled (no division by zero)
- [ ] Null revenue treated correctly (not as zero)
- [ ] No linked projects shows appropriate empty state
- [ ] Manual override clearly indicated visually
- [ ] Auto-calculation does not overwrite manual override
- [ ] Decimal precision maintained (no floating-point display artifacts)
- [ ] Currency formatting consistent with rest of app (RM)

**Date Intelligence:**
- [ ] endDate before startDate flagged as error (not warning)
- [ ] Duration thresholds based on actual data distribution
- [ ] Overlap scope defined (person? KR? department?)
- [ ] Warnings are non-blocking (inline indicators)
- [ ] Past-due initiatives flagged (endDate < today + status != COMPLETED)
- [ ] Dates outside fiscal year 2026 flagged

**Excel Export:**
- [ ] All initiative fields included
- [ ] Linked project data included (at least count and total revenue)
- [ ] Column headers human-readable (not enum values)
- [ ] Status formatted as readable text, not enum
- [ ] Dates formatted as dates (not ISO strings)
- [ ] Currency columns formatted with 2 decimal places
- [ ] File downloads with descriptive filename (includes date)
- [ ] Works on NAS (server-side generation, tested on deployment)

**Linked Projects:**
- [ ] Handles initiatives with 0 projects
- [ ] Handles initiatives with multiple projects
- [ ] Revenue shows potentialRevenue vs actual revenue distinction
- [ ] Costs aggregated correctly (sum of all project costs)
- [ ] Project status badges match the project list view styling
- [ ] Click on project navigates to project detail (not just shows text)

---

## Pitfall-to-Phase Mapping

| Pitfall | # | Prevention Phase | Verification |
|---------|---|------------------|--------------|
| Free-text keyResult grouping fragility | 1 | Phase 1: By Objective view | Test with varied keyResult strings; verify group counts match total |
| KPI auto-calculation edge cases | 2 | Phase 3: KPI metrics | Test with 0 projects, null revenue, zero target, all-null scenarios |
| Tight coupling between view mode and data | 3 | Phase 1: Architecture | Ensure single data source for all view modes |
| SheetJS npm vulnerability | 4 | Phase 5: Library selection | Run `npm audit`; verify using ExcelJS not xlsx |
| Tree view state management | 5 | Phase 1: Component design | Edit initiative in hierarchy view, verify expand state preserved |
| Date threshold arbitrariness | 6 | Phase 4: Pre-implementation | Query actual durations before setting thresholds |
| Excel export NAS resource usage | 7 | Phase 5: Testing | Test export on NAS deployment, verify <1s response |
| N+1 queries for project data | 8 | Phase 2: API design | Check Prisma query logs, verify single query |
| Manual KPI override overwrite | 9 | Phase 3: Data model | Set manual value, update project, verify override preserved |
| Timeline overlap ambiguity | 10 | Phase 4: Requirements | Define overlap scope before any code |

---

## SAAP-Specific Context Notes

These pitfalls account for the specific SAAP constraints:

1. **Small dataset (28 initiatives, ~50 projects):** Performance traps exist but will not manifest at current scale. Prevention is about avoiding architectural debt, not immediate performance.

2. **NAS deployment (`nice -n 19`):** Server-side computation is fine for small data. The constraint matters if data grows 10x.

3. **keyResult as VarChar(20):** This is the highest-risk structural issue. The field was imported from Excel with consistent values, but the input form has no constraints. Data drift will happen.

4. **3 users only:** Date overlap detection for resource allocation is highly actionable -- there are only 3 people. If person X has 8 concurrent initiatives, that is a real problem for a 3-person team.

5. **`xlsx: ^0.18.5` already in package.json:** This is used ONLY by the seed script (`prisma/seed.ts`). Do NOT extend its use to user-facing features. Use ExcelJS for export.

6. **Existing patterns to reuse:**
   - TaskTree expand state management (Key Decision: "Expand state in parent TaskTree")
   - Dialog modal for detail views (Key Decision: "Dialog modal for detail views")
   - Server-side includes matching client fetches (Key Decision: "Server queries mirror API includes")

---

## Sources

### OKR/Hierarchy Patterns
- [OKR Hierarchy Examples - Broadcom Rally](https://techdocs.broadcom.com/us/en/ca-enterprise-software/valueops/rally/rally-help/planning/objectives-and-key-results-okrs/create-an-okr-hierarchy-in-rally/examples-of-okr-hierarchies.html)
- [OKR Best Practices 2026 - Synergita](https://www.synergita.com/blog/okr-best-practices/)
- [OKRs Guide - Mooncamp](https://mooncamp.com/okr)

### KPI Calculation Edge Cases
- [Power BI KPI Matrix Zero Target Issue](https://community.fabric.microsoft.com/t5/Power-Query/Power-BI-KPI-Matrix-Displaying-Zero-Target-Value/td-p/2270460)
- [KPI Score Calculation with Negative Actuals - SAP Community](https://community.sap.com/t5/financial-management-q-a/score-calculation-for-kpis-where-actuals-are-negative/qaq-p/6973692)
- [How to Calculate KPIs and Create a Scorecard - BSC Designer](https://bscdesigner.com/calculate-metrics.htm)
- [Target and Actuals KPI Types - CAM Management](https://interplan.cammanagementsolutions.com.au/UserManual/performance_measurement/kpis/kpi_types/target_and_actuals.htm)

### Excel Export in Next.js
- [How to Download xlsx Files from a Next.js Route Handler - Dave Gray](https://www.davegray.codes/posts/how-to-download-xlsx-files-from-a-nextjs-route-handler)
- [ExcelJS on npm](https://www.npmjs.com/package/exceljs)
- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [SheetJS Community Edition - Next.js Docs](https://docs.sheetjs.com/docs/demos/static/nextjs/)

### Tree View / Hierarchy UX
- [Tree Data in React Tables - Simple Table](https://www.simple-table.com/blog/react-tree-data-hierarchical-tables)
- [Designing UI for Tree Data - Retool](https://retool.com/blog/designing-a-ui-for-tree-data)
- [API Design for a React Tree Table - Robin Wieruch](https://www.robinwieruch.de/react-tree-list/)

### Data Grouping / Normalization
- [Database Normalization Description - Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/access/database-normalization-description)
- [Exploring Database Normalization Effects on SQL Generation](https://arxiv.org/html/2510.01989v1)

### Timeline Visualization & Overlap
- [Timeline Graph Visualization - Handling Overlaps - Tom Sawyer Software](https://blog.tomsawyer.com/timeline-graph-visualization)
- [KronoGraph Timeline Visualization - Cambridge Intelligence](https://cambridge-intelligence.com/kronograph/)

### KPI Dashboard Design
- [The Engineering KPI Trap - Appfire](https://appfire.com/resources/blog/engineering-kpis-that-matter)
- [KPI Dashboards Comprehensive Guide - SimpleKPI](https://www.simplekpi.com/Blog/KPI-Dashboards-a-comprehensive-guide)

---
*Pitfalls research for: OKR/Initiative Management with KPI Tracking, Date Intelligence & Excel Export*
*Researched: 2026-01-26*
