# Project Research Summary

**Project:** SAAP 2026 v2 - v1.2 CRM & Project Financials
**Domain:** Sales Pipeline CRM + Project Cost Tracking
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

v1.2 adds a sales pipeline CRM and project financials tracking to the existing SAAP platform. Research indicates this is a well-understood domain with established patterns. For a 3-person internal team with high-ticket, low-volume deals, the recommended approach is a simplified 5-stage Kanban pipeline (Lead > Qualified > Proposal > Negotiation > Won/Lost) that auto-converts won deals to Projects. The existing stack (Next.js 14, Prisma, MariaDB, shadcn/ui) handles everything with minimal additions: `nanoid` for file naming and `react-currency-input-field` for UX. The already-installed `@dnd-kit` library covers Kanban functionality.

The architecture centers on a **unified Deal entity with source tracking** rather than separate pipelines for new vs. repeat clients. Projects have three entry points (pipeline deals, repeat client potentials, direct creation) and optionally link to KRIs. Costs are tracked as line items with file-based receipt storage (not database BLOBs). Profit is calculated on-read as revenue minus costs.

The critical risks are: (1) floating-point currency errors -- use `Decimal(12,2)` in Prisma and currency.js in application code; (2) missing audit trails for financial changes -- log all modifications with user attribution; (3) invalid pipeline stage transitions -- implement state machine validation; (4) lost deal context on project conversion -- maintain bidirectional relationships; (5) receipt storage bloating the database -- store files on filesystem, paths in database. All pitfalls have clear mitigation patterns documented.

## Key Findings

### Recommended Stack

The existing stack requires only 1-2 new packages. The v1.0 infrastructure already includes `@dnd-kit` for Kanban boards (used in initiatives), `recharts` for dashboards, and `date-fns` for date handling.

**New packages to install:**
- `nanoid` (^5.0.9): URL-safe unique file naming for receipts -- 21 chars, collision-resistant
- `react-currency-input-field` (^4.0.3): Currency input formatting -- locale-aware, ISO 4217 support

**Already installed (reuse):**
- `@dnd-kit/core`, `@dnd-kit/sortable`: Sales pipeline Kanban
- `recharts`: Pipeline/revenue dashboard charts
- `date-fns`: Date formatting for timelines

**What NOT to use:**
- UploadThing/S3/Cloudinary: Overkill for 3-user internal tool on NAS
- Multer/Formidable: Native Server Actions handle uploads fine
- Float for currency: Precision errors; use Decimal
- react-beautiful-dnd: Deprecated; `@dnd-kit` is already installed

### Expected Features

**Must have (table stakes):**
- Visual pipeline Kanban (Lead > Qualified > Proposal > Negotiation > Won/Lost)
- Deal value tracking with currency input
- Deal-to-project auto-conversion on Won status
- Company and client PIC tracking
- Repeat client potential projects (Potential > Confirmed/Cancelled)
- Project entity with three entry points
- Cost line items with categories (Labor, Materials, Vendors, Travel, Software, Other)
- Receipt uploads with file storage
- Profit calculation (revenue - costs)
- Pipeline and revenue dashboard widgets

**Should have (build in v1.2):**
- Weighted pipeline value (probability * deal value)
- Deal notes/activity log
- Expected close date on deals
- Lost deal reason tracking

**Defer (v2+):**
- Cost vs budget comparison
- Time tracking
- Invoice generation
- Multi-currency support
- Win rate analytics
- Sales cycle analysis

### Architecture Approach

The architecture extends the existing Next.js App Router patterns with new domain models. Client is the foundational entity linking to Deals, PotentialProjects, and Projects. A Deal represents new business pipeline opportunities; PotentialProject handles repeat client work. Both can convert to Projects, which can also be created directly (standalone) or linked to KRIs. Costs are tracked as line items belonging to Projects, with CostCategory as a lookup table.

**Major components:**
1. **Client** -- Company/contact information, repeat client flag
2. **Deal** -- New business pipeline with 5 stages, value, probability
3. **PotentialProject** -- Repeat client pipeline with 3 stages
4. **Project** -- Actual work; three entry points; revenue tracking
5. **Cost** -- Line items with category, amount, receipt path
6. **CostCategory** -- Seeded lookup (Labor, Materials, Vendors, Travel, Software, Other)

**Data flow:**
- Deal (Won) --> auto-creates Project with revenue from deal value
- PotentialProject (Confirmed) --> auto-creates Project
- Direct creation --> Project without deal/potential link
- All Projects --> Costs with optional receipts

### Critical Pitfalls

1. **Floating-point currency calculations** -- Use `Decimal(12,2)` in Prisma schema, `currency.js` or integer cents in application code. Never use JavaScript `Number` for money math.

2. **Missing audit trail for financial changes** -- Create DealHistory/CostHistory models to log who changed what and when. Use Prisma transactions to ensure audit entries are created atomically.

3. **Pipeline stage transitions without validation** -- Implement state machine pattern with `VALID_TRANSITIONS` map. Prevent invalid moves like Lead > Won (skipping qualification).

4. **Deal-to-project conversion data loss** -- Maintain bidirectional relationship (Deal.projectId, Project.sourceDealId). Copy client PIC, proposal notes, agreed terms at conversion.

5. **Receipt storage in database BLOB** -- Store files on filesystem (`/uploads/receipts/`), store path in database. Configure Docker volume for NAS persistence. Use API route with auth for serving files.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Schema & Core Entities)
**Rationale:** All subsequent work depends on data models. Establish money-handling patterns before any financial data is stored.
**Delivers:** Prisma schema migration, Client entity, CostCategory seeded data
**Addresses:** Company tracking, cost categories
**Avoids:** Floating-point currency errors, pipeline confusion (single Deal entity with source)
**Research needed:** None -- standard Prisma patterns

### Phase 2: Sales Pipeline
**Rationale:** Deals are the primary entry point for projects and revenue tracking. Pipeline must work before conversion flow.
**Delivers:** Deal model, Pipeline Kanban board, stage validation, deal form
**Addresses:** Visual pipeline, deal stages, deal value tracking
**Avoids:** Invalid stage transitions (implement state machine), lost deal reasons (require on close)
**Uses:** @dnd-kit (already installed), react-currency-input-field (new)
**Research needed:** None -- @dnd-kit patterns from v1.0 initiatives Kanban

### Phase 3: Repeat Client Pipeline
**Rationale:** Similar to Phase 2 but simpler flow. Can share UI patterns.
**Delivers:** PotentialProject model, Potential board, conversion flow
**Addresses:** Potential projects list, repeat client tracking
**Implements:** Same Kanban patterns as Phase 2
**Research needed:** None -- direct reuse of Phase 2 patterns

### Phase 4: Projects & Conversion
**Rationale:** Depends on Deal and PotentialProject to be complete. Projects are where value is delivered.
**Delivers:** Project model, three creation flows (from deal, from potential, direct), KRI linking
**Addresses:** Project entity, deal-to-project conversion, initiative linking
**Avoids:** Deal context loss (maintain bidirectional links), orphaned projects
**Research needed:** None -- standard CRUD with optional relations

### Phase 5: Cost Tracking & Receipts
**Rationale:** Costs depend on Projects existing. Receipt upload is isolated feature.
**Delivers:** Cost model, cost form, receipt upload, profit calculation
**Addresses:** Cost line items, categories, receipt uploads, profit
**Avoids:** Database BLOB storage (use filesystem), missing indirect costs (include labor category)
**Uses:** nanoid (new), Server Actions for upload
**Research needed:** Low -- file upload patterns documented in STACK.md

### Phase 6: Dashboard & Polish
**Rationale:** Dashboard depends on all data being in place. Polish after core features work.
**Delivers:** Pipeline widget, revenue/profit summary, weighted forecast
**Addresses:** Pipeline metrics, revenue summary, profit summary
**Avoids:** Stale dashboard data (implement caching), unrealistic forecasts (use probability weighting)
**Research needed:** None -- recharts already used in v1.0

### Phase Ordering Rationale

- **Dependencies flow downward:** Client > Deal/Potential > Project > Cost. Building in this order avoids rework.
- **Early value delivery:** Phase 2 (Pipeline) delivers usable functionality for deal tracking even before cost features.
- **Kanban reuse:** Phase 2 establishes Kanban patterns that Phase 3 reuses directly.
- **Conversion after entities:** Deal-to-Project conversion in Phase 4 requires both entities to exist.
- **File upload isolation:** Receipt uploads in Phase 5 are self-contained; can be tested independently.
- **Dashboard last:** Aggregation widgets need data to aggregate.

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Standard Prisma schema design, well-documented
- **Phase 2 (Pipeline):** @dnd-kit patterns exist in v1.0 codebase
- **Phase 3 (Potential):** Direct reuse of Phase 2
- **Phase 4 (Projects):** Standard CRUD with relations
- **Phase 6 (Dashboard):** recharts patterns exist in v1.0

**Phases that may need light research during execution:**
- **Phase 5 (Receipts):** File upload edge cases (large files, file type validation) may need testing. Patterns documented in STACK.md should suffice.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Minimal additions to existing stack; packages well-documented |
| Features | HIGH | CRM and cost tracking are mature domains with clear patterns |
| Architecture | HIGH | Builds on existing codebase patterns; ERD is straightforward |
| Pitfalls | HIGH | Financial and CRM pitfalls well-documented in industry literature |

**Overall confidence:** HIGH

### Gaps to Address

- **Audit trail implementation:** Research recommends it, but adds schema complexity. Consider deferring to v1.3 if timeline is tight. At minimum, track deal value changes.
- **Stage history tracking:** Nice-to-have for sales velocity metrics. Can defer full implementation but include `stageChangedAt` field on Deal.
- **Receipt file serving:** API route with auth is recommended, but symlink approach is simpler. Decide during Phase 5 based on security requirements.

## Open Questions

1. **Should Potential Projects be a separate entity or merged into Deal with source flag?**
   - Research suggests single Deal entity with `source: REPEAT_CLIENT` is cleaner
   - But separate entity keeps repeat client flow simpler for the UI
   - Recommendation: Keep separate for v1.2, consider merging in future refactor

2. **How much audit trail is needed for v1.2?**
   - Full history tables add complexity
   - Minimum viable: `updatedAt`, `updatedBy` on financial fields
   - Recommendation: Start with basic tracking, add history tables if needed

3. **Should weighted pipeline use per-deal probability or per-stage default?**
   - Per-deal allows customization but adds friction
   - Per-stage is simpler and more consistent
   - Recommendation: Start with per-stage defaults, allow per-deal override

## Sources

### Primary (HIGH confidence)
- Prisma documentation: Decimal types, relations, indexes
- @dnd-kit documentation: Kanban implementation patterns
- Existing codebase: `src/app/api/initiatives/`, `prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- [monday.com Pipeline Stages](https://monday.com/blog/crm-and-sales/sales-pipeline-stages/) -- Stage definitions
- [Scoro Project Cost Tracking](https://www.scoro.com/blog/project-cost-tracking/) -- Cost categories
- [eWay-CRM Deal Conversion](https://www.eway-crm.com/resources/how-to-use-eway-crm/convert-deals-companies-contacts-projects/) -- Conversion patterns
- [currency.js](https://currency.js.org/) -- Money handling in JavaScript
- [Honeybadger Currency Guide](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/) -- Floating-point pitfalls

### Tertiary (LOW confidence)
- Community patterns for Next.js file uploads -- verify during Phase 5 implementation

---
*Research completed: 2026-01-22*
*Ready for roadmap: yes*
