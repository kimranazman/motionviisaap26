# Research: Phase 65 - Internal Project Flag

## RESEARCH COMPLETE

## Overview

Phase 65 adds support for internal projects (Motionvii / Talenta) that don't require an external company. Currently, `companyId` is a required non-nullable field on the Project model, enforced in both the Prisma schema and application logic.

## Current State

### Schema (prisma/schema.prisma)
- `Project.companyId` is `String` (required, non-nullable)
- `Project.company` relation uses `@relation(fields: [companyId], references: [id])`
- No `isInternal` field or `internalEntity` field exists

### API Layer
1. **POST /api/projects** (`src/app/api/projects/route.ts`)
   - Validates `companyId` as required: returns 400 if missing
   - Creates project with `companyId` from body

2. **PATCH /api/projects/[id]** (`src/app/api/projects/[id]/route.ts`)
   - Allows updating `companyId` via body
   - Includes company in response

3. **GET /api/projects** (`src/app/api/projects/route.ts`)
   - Includes `company: { select: { id, name } }` in query
   - No type filtering

4. **GET /api/ai/pending** (`src/app/api/ai/pending/route.ts`)
   - Accesses `doc.project.company.name` directly (line 75) -- will crash on null

5. **GET /api/suppliers/[id]** (`src/app/api/suppliers/[id]/route.ts`)
   - Accesses `cost.project.company` -- already typed as nullable in the Map

### UI Components
1. **project-form-modal.tsx** - Create form requires companyId, validates as required
2. **project-card.tsx** - Conditionally renders `project.company` (already null-safe with `{project.company && ...}`)
3. **project-list.tsx** - Status filter only (ALL/DRAFT/ACTIVE/COMPLETED/CANCELLED), no type filter
4. **project-detail-sheet.tsx** - Validates companyId as required in handleSave, sets from project.company?.id
5. **project-detail-page-client.tsx** - Displays company with `project.company?.name || 'No company'` (partially null-safe)
6. **supplier-detail-modal.tsx** - Already null-safe: `{project.company && ...}`
7. **pending-analysis-widget.tsx** - Displays `{project.company}` (string from API, will be empty/null for internal)
8. **linked-projects-section.tsx** - Uses `companyName: string | null`, already null-safe
9. **manifest-utils.ts** - `project.company.name` at line 88 -- will crash on null

### Server Page
- **projects/page.tsx** - Server component fetches projects with company include, no filtering by type

## Required Changes

### 1. Schema Changes (INT-01)
- Add `isInternal Boolean @default(false)` to Project model
- Add `internalEntity String? @db.VarChar(50)` to Project model (values: "MOTIONVII" or "TALENTA")
- Make `companyId` optional: `String?` instead of `String`
- Add index on `isInternal`

### 2. API Changes (INT-02, INT-05)
- **POST /api/projects**: Allow creating without companyId when isInternal=true
- **PATCH /api/projects/[id]**: Allow null companyId for internal projects
- **GET /api/projects**: Add `type` query param filter (all/client/internal)
- **GET /api/ai/pending**: Null-safe company access
- **manifest-utils.ts**: Null-safe company access

### 3. UI Changes (INT-02, INT-03, INT-04)
- **project-form-modal.tsx**: Add internal toggle, show entity selector when internal, hide company when internal
- **project-list.tsx**: Add type filter tabs (All / Client / Internal)
- **project-card.tsx**: Show "Internal" badge, show entity name instead of company for internal projects
- **project-detail-sheet.tsx**: Support internal mode in edit form
- **project-detail-page-client.tsx**: Show Internal badge, entity name display
- **pending-analysis-widget.tsx**: Handle null/missing company gracefully

## Files to Modify

### Wave 1: Schema + API (foundation)
1. `prisma/schema.prisma` - Add fields, make companyId nullable
2. `src/app/api/projects/route.ts` - POST/GET changes
3. `src/app/api/projects/[id]/route.ts` - PATCH changes
4. `src/app/api/ai/pending/route.ts` - Null-safe company
5. `src/lib/manifest-utils.ts` - Null-safe company

### Wave 2: UI (depends on API)
6. `src/components/projects/project-form-modal.tsx` - Internal project creation
7. `src/components/projects/project-card.tsx` - Internal badge
8. `src/components/projects/project-list.tsx` - Type filter
9. `src/components/projects/project-detail-sheet.tsx` - Internal project editing
10. `src/app/(dashboard)/projects/[id]/project-detail-page-client.tsx` - Internal badge/display
11. `src/app/(dashboard)/projects/page.tsx` - Pass type filter to API
12. `src/components/dashboard/pending-analysis-widget.tsx` - Null-safe company display

## Design Decisions

1. **Internal entity as string enum** - Use `internalEntity` field with "MOTIONVII" | "TALENTA" values rather than a separate entity table. Only 2 values, won't grow.
2. **companyId becomes nullable** - Cleanest approach. Internal projects have no company; companyId is null.
3. **isInternal as explicit flag** - Better than inferring from null companyId. Explicit intent.
4. **Type filter approach** - Add tab group alongside existing status filter. Values: All / Client / Internal.
5. **Badge placement** - Reuse existing badge row in project-card, add "Internal" badge with distinct color.
