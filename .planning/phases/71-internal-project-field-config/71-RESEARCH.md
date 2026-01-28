# Phase 71 Research: Internal Project Field Config

## Domain Analysis

### What needs to happen
Admin configures which fields are hidden when a project is internal. Fields include: revenue, potentialRevenue, pipeline source (deal/potential), company/contact, and initiative link. Configuration is system-wide via AdminDefaults (not per-user).

### Current Architecture

**AdminDefaults Model** (`prisma/schema.prisma` line 631):
- Singleton pattern with `id = 'singleton'`
- Currently stores: `dashboardLayout Json`, `widgetRoles Json`
- Needs a new `internalFieldConfig Json` column for field visibility
- Managed via `src/lib/widgets/defaults.ts` (getAdminDefaults, updateAdminDefaults)

**Project Model** (`prisma/schema.prisma` line 473):
- `isInternal Boolean @default(false)` - indicates internal project
- `internalEntity String?` - MOTIONVII or TALENTA
- Fields that should be configurable for hiding:
  - `revenue` / `potentialRevenue` - financial fields
  - `companyId` / `contactId` - company/contact association
  - `initiativeId` - KRI link
  - `sourceDeal` / `sourcePotential` - pipeline source (read-only display)

**Project Form Modal** (`src/components/projects/project-form-modal.tsx`):
- Create form with: title, isInternal toggle, entity, company, contact, revenue, KRI link, description
- When `isInternal=true`: already hides company/contact fields, shows entity selector
- Revenue field is always shown (needs conditional hiding)
- KRI link is always shown (needs conditional hiding)

**Project Detail Sheet** (`src/components/projects/project-detail-sheet.tsx`):
- Edit form (drawer/dialog) with same fields plus: status, dates, costs, deliverables, tasks, documents
- Has FinancialsSummary sub-component showing revenue cards
- KRI link section, source info section
- Company/contact already conditionally shown based on isInternal

**Project Detail Page** (`src/app/(dashboard)/projects/[id]/project-detail-page-client.tsx`):
- Full page view showing: header (with company/entity), Details card, Financials card, Deliverables, Tasks, Costs, Documents
- Company/Contact fields in Details card
- Initiative field in Details card
- Source field (deal/potential) in Details card
- Revenue data in Financials card

**Settings Page** (`src/app/(dashboard)/settings/page.tsx`):
- Currently has: Detail View Mode card, Sidebar Navigation card
- Need to add: Internal Project Field Config card (admin-only section)

**Admin API Pattern** (`src/app/api/admin/dashboard/`):
- Uses `requireAdmin()` for auth
- GET returns current config, PUT updates it
- Pattern: getAdminDefaults() → update → revalidate

### Fields to Configure

Based on INTL-02, the configurable fields are:
1. `revenue` - Actual revenue (from AI invoices)
2. `potentialRevenue` - Potential revenue (from deal/potential conversion)
3. `pipelineSource` - Source deal/potential display
4. `companyContact` - Company and Contact fields (already hidden when internal, but admin config makes this explicit)
5. `initiativeLink` - KRI/Initiative link

### Default Values (INTL-06)

Sensible defaults for internal projects:
- `revenue`: hidden (internal projects typically don't have revenue)
- `potentialRevenue`: hidden
- `pipelineSource`: hidden (internal projects aren't from pipeline)
- `companyContact`: hidden (already the case, but now explicit)
- `initiativeLink`: visible (internal projects may link to initiatives)

### Implementation Approach

**Plan 1: Backend (Schema + API + Hook)**
1. Add `internalFieldConfig Json?` to AdminDefaults in Prisma schema
2. Define TypeScript interface for the config
3. Extend `getAdminDefaults()` and `updateAdminDefaults()` to handle new field
4. Create API route: `GET/PUT /api/admin/internal-fields`
5. Create React hook: `useInternalFieldConfig()` to fetch and cache config

**Plan 2: Frontend (Settings UI + Form/Detail Integration)**
1. Add admin section to Settings page with field toggle switches
2. Integrate config into ProjectFormModal - conditionally hide fields when isInternal
3. Integrate config into ProjectDetailSheet - hide fields in edit form
4. Integrate config into ProjectDetailPageClient - hide fields in read-only view
5. Apply sensible defaults when no config exists

### Key Design Decisions

1. **Store as JSON in AdminDefaults** - follows existing pattern, no schema migration needed for future field additions
2. **Config shape**: `{ hiddenFields: string[] }` where each string is a field key - simple, extensible
3. **Default behavior**: When no config exists, apply sensible defaults (hide revenue + pipeline for internal)
4. **Client-side filtering**: Fetch config once, hide fields in React components - no server-side changes to project API
5. **Settings placement**: New card in Settings page, visible only to admins

## RESEARCH COMPLETE
