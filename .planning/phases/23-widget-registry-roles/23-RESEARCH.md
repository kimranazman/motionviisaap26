# Phase 23: Widget Registry & Roles - Research

**Researched:** 2026-01-23
**Domain:** Widget registry system, role-based access control for dashboard widgets
**Confidence:** HIGH

## Summary

This phase establishes a widget registry system with role-based access control for the dashboard. The research focused on three key areas: (1) TypeScript registry pattern for widget definitions, (2) server-side enforcement of role-based widget visibility, and (3) AdminDefaults singleton pattern for managing default layouts and role restrictions.

The project already has:
- `UserPreferences` model with `dashboardLayout: Json?` field for storing user's widget configuration
- `AdminDefaults` model with `dashboardLayout: Json` and `widgetRoles: Json` fields
- TypeScript interfaces in `src/types/dashboard.ts` for `WidgetConfig`, `DashboardLayout`, `WidgetRoleRestrictions`
- Existing dashboard with 7 distinct widget components (KPICards, StatusChart, DepartmentChart, TeamWorkload, RecentInitiatives, CRMKPICards, PipelineStageChart)
- Three roles: `ADMIN`, `EDITOR`, `VIEWER` (from `UserRole` enum)
- `requireRole()` and `requireAuth()` utilities in `src/lib/auth-utils.ts`

**Primary recommendation:** Create a widget registry that maps widget IDs to their metadata (component, default size, data dependencies, minimum required role). Implement server-side filtering in the dashboard page's data fetching functions to exclude widgets the user cannot access. Store role restrictions in AdminDefaults.widgetRoles and allow admins to configure which roles can see which widgets.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.28 | Server-side rendering, API routes | Already in use, server components for role filtering |
| Prisma | 6.19.2 | Database models (JSON fields) | Already in use, AdminDefaults/UserPreferences models exist |
| TypeScript | 5.7+ | Type-safe widget registry | Already in use, interfaces defined |
| NextAuth | 5.x | Session with role information | Already in use, session.user.role available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Runtime validation of JSON structures | Validating widget config from database |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom registry | react-grid-layout | RGL is for drag/drop layouts (Phase 24); registry is simpler metadata mapping |
| JSON widgetRoles | Separate WidgetRole table | JSON more flexible, fewer migrations for adding widgets |
| Role array in registry | Database-only restrictions | Registry provides default permissions; DB allows admin override |

**Installation:**
No additional packages required - all functionality available with existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── widgets/
│       ├── registry.ts           # Widget registry with metadata
│       ├── permissions.ts        # Widget permission utilities
│       └── defaults.ts           # Default layout & role configs
├── components/
│   └── dashboard/
│       ├── widget-wrapper.tsx    # Role-aware widget container
│       └── [existing widgets]    # KPICards, StatusChart, etc.
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx              # Updated to use registry
│   └── api/
│       └── admin/
│           └── dashboard/
│               └── route.ts      # Admin endpoints for defaults
└── types/
    └── dashboard.ts              # Extended widget types
```

### Pattern 1: TypeScript Widget Registry
**What:** Central registry mapping widget IDs to metadata and components
**When to use:** Any multi-widget dashboard with configurable visibility
**Example:**
```typescript
// src/lib/widgets/registry.ts
import { UserRole } from '@prisma/client'

export interface WidgetDefinition {
  id: string
  title: string
  description: string
  defaultSize: { w: number; h: number }
  minRole: UserRole        // Minimum role to view this widget
  category: 'kri' | 'crm' | 'financials'
  dataKey?: string         // Key for data fetching
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'kpi-cards': {
    id: 'kpi-cards',
    title: 'KPI Overview',
    description: 'Initiative statistics and completion metrics',
    defaultSize: { w: 12, h: 2 },
    minRole: 'VIEWER',
    category: 'kri',
    dataKey: 'stats',
  },
  'status-chart': {
    id: 'status-chart',
    title: 'Status Distribution',
    description: 'Initiative status breakdown pie chart',
    defaultSize: { w: 6, h: 3 },
    minRole: 'VIEWER',
    category: 'kri',
    dataKey: 'byStatus',
  },
  'department-chart': {
    id: 'department-chart',
    title: 'By Department',
    description: 'Initiatives grouped by department',
    defaultSize: { w: 6, h: 3 },
    minRole: 'VIEWER',
    category: 'kri',
    dataKey: 'byDepartment',
  },
  'team-workload': {
    id: 'team-workload',
    title: 'Team Workload',
    description: 'Initiative distribution by team member',
    defaultSize: { w: 6, h: 3 },
    minRole: 'VIEWER',
    category: 'kri',
    dataKey: 'byPerson',
  },
  'recent-initiatives': {
    id: 'recent-initiatives',
    title: 'Recent Activity',
    description: 'Recently updated initiatives',
    defaultSize: { w: 6, h: 3 },
    minRole: 'VIEWER',
    category: 'kri',
    dataKey: 'recentInitiatives',
  },
  'crm-kpi-cards': {
    id: 'crm-kpi-cards',
    title: 'Sales KPIs',
    description: 'Pipeline value, forecast, win rate, revenue, profit',
    defaultSize: { w: 12, h: 2 },
    minRole: 'EDITOR',      // Revenue/profit sensitive - restrict to Editor+
    category: 'crm',
    dataKey: 'crmStats',
  },
  'pipeline-stage-chart': {
    id: 'pipeline-stage-chart',
    title: 'Pipeline Stages',
    description: 'Deal distribution by pipeline stage',
    defaultSize: { w: 12, h: 3 },
    minRole: 'EDITOR',      // Pipeline values sensitive
    category: 'crm',
    dataKey: 'stageData',
  },
}

export const WIDGET_IDS = Object.keys(WIDGET_REGISTRY) as (keyof typeof WIDGET_REGISTRY)[]
```

### Pattern 2: Role-Based Widget Permission Checking
**What:** Utility functions to check if a user can view a widget
**When to use:** Server-side filtering and client-side UI hiding
**Example:**
```typescript
// src/lib/widgets/permissions.ts
import { UserRole } from '@prisma/client'
import { WIDGET_REGISTRY, WidgetDefinition } from './registry'
import { WidgetRoleRestrictions } from '@/types/dashboard'

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: UserRole[] = ['VIEWER', 'EDITOR', 'ADMIN']

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/**
 * Check if user can view a specific widget
 * Uses admin overrides from widgetRoles, falls back to registry default
 */
export function canViewWidget(
  widgetId: string,
  userRole: UserRole,
  widgetRoles?: WidgetRoleRestrictions
): boolean {
  const widget = WIDGET_REGISTRY[widgetId]
  if (!widget) return false

  // Check admin override first
  if (widgetRoles && widgetRoles[widgetId]) {
    const allowedRoles = widgetRoles[widgetId]
    return allowedRoles.includes(userRole)
  }

  // Fall back to widget's default minimum role
  return hasMinimumRole(userRole, widget.minRole)
}

/**
 * Filter widget list to only those visible to user
 */
export function filterWidgetsByRole(
  widgetIds: string[],
  userRole: UserRole,
  widgetRoles?: WidgetRoleRestrictions
): string[] {
  return widgetIds.filter(id => canViewWidget(id, userRole, widgetRoles))
}

/**
 * Get all widgets visible to a specific role
 */
export function getVisibleWidgets(
  userRole: UserRole,
  widgetRoles?: WidgetRoleRestrictions
): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter(
    widget => canViewWidget(widget.id, userRole, widgetRoles)
  )
}
```

### Pattern 3: AdminDefaults Singleton Upsert
**What:** Ensure single AdminDefaults row exists; use upsert pattern
**When to use:** System-wide settings that should have exactly one record
**Example:**
```typescript
// src/lib/widgets/defaults.ts
import { prisma } from '@/lib/prisma'
import { DashboardLayout, WidgetRoleRestrictions } from '@/types/dashboard'
import { WIDGET_REGISTRY } from './registry'

const ADMIN_DEFAULTS_ID = 'singleton'

// Default layout for new users (all widgets visible to role)
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    { id: 'kpi-cards', x: 0, y: 0, w: 12, h: 2 },
    { id: 'status-chart', x: 0, y: 2, w: 6, h: 3 },
    { id: 'department-chart', x: 6, y: 2, w: 6, h: 3 },
    { id: 'team-workload', x: 0, y: 5, w: 6, h: 3 },
    { id: 'recent-initiatives', x: 6, y: 5, w: 6, h: 3 },
    { id: 'crm-kpi-cards', x: 0, y: 8, w: 12, h: 2 },
    { id: 'pipeline-stage-chart', x: 0, y: 10, w: 12, h: 3 },
  ],
}

// Default role restrictions (derived from registry minRole)
export function getDefaultWidgetRoles(): WidgetRoleRestrictions {
  const restrictions: WidgetRoleRestrictions = {}
  for (const [id, widget] of Object.entries(WIDGET_REGISTRY)) {
    // By default, allow the minimum role and all higher roles
    if (widget.minRole === 'VIEWER') {
      restrictions[id] = ['VIEWER', 'EDITOR', 'ADMIN']
    } else if (widget.minRole === 'EDITOR') {
      restrictions[id] = ['EDITOR', 'ADMIN']
    } else {
      restrictions[id] = ['ADMIN']
    }
  }
  return restrictions
}

/**
 * Get or create AdminDefaults singleton
 */
export async function getAdminDefaults() {
  const defaults = await prisma.adminDefaults.upsert({
    where: { id: ADMIN_DEFAULTS_ID },
    update: {}, // Don't update if exists
    create: {
      id: ADMIN_DEFAULTS_ID,
      dashboardLayout: DEFAULT_DASHBOARD_LAYOUT as any,
      widgetRoles: getDefaultWidgetRoles() as any,
    },
  })
  return {
    ...defaults,
    dashboardLayout: defaults.dashboardLayout as unknown as DashboardLayout,
    widgetRoles: defaults.widgetRoles as unknown as WidgetRoleRestrictions,
  }
}

/**
 * Update admin defaults (admin only)
 */
export async function updateAdminDefaults(
  updates: Partial<{ dashboardLayout: DashboardLayout; widgetRoles: WidgetRoleRestrictions }>
) {
  return prisma.adminDefaults.update({
    where: { id: ADMIN_DEFAULTS_ID },
    data: {
      ...(updates.dashboardLayout && { dashboardLayout: updates.dashboardLayout as any }),
      ...(updates.widgetRoles && { widgetRoles: updates.widgetRoles as any }),
    },
  })
}
```

### Pattern 4: Server-Side Widget Filtering in Dashboard Page
**What:** Filter widget data and visibility server-side before rendering
**When to use:** Dashboard page that needs role-based widget visibility
**Example:**
```typescript
// In src/app/(dashboard)/page.tsx
import { auth } from '@/auth'
import { getAdminDefaults } from '@/lib/widgets/defaults'
import { canViewWidget, filterWidgetsByRole } from '@/lib/widgets/permissions'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userRole = session.user.role
  const adminDefaults = await getAdminDefaults()

  // Get visible widget IDs for this user
  const allWidgetIds = ['kpi-cards', 'status-chart', 'department-chart',
                        'team-workload', 'recent-initiatives',
                        'crm-kpi-cards', 'pipeline-stage-chart']

  const visibleWidgetIds = filterWidgetsByRole(
    allWidgetIds,
    userRole,
    adminDefaults.widgetRoles
  )

  // Only fetch data for visible widgets
  const data = await getDashboardData()
  const crmData = visibleWidgetIds.some(id => id.startsWith('crm') || id === 'pipeline-stage-chart')
    ? await getCRMDashboardData()
    : null

  return (
    <div>
      {visibleWidgetIds.includes('kpi-cards') && <KPICards stats={data.stats} />}
      {visibleWidgetIds.includes('status-chart') && <StatusChart data={data.byStatus} />}
      {/* ... other widgets conditionally rendered */}
      {crmData && visibleWidgetIds.includes('crm-kpi-cards') && (
        <CRMKPICards {...crmData} />
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Client-only role checks:** Never rely solely on hiding UI elements; always filter server-side
- **Hardcoded role checks per widget:** Use registry pattern, not scattered if-statements
- **Direct role comparison:** Use role hierarchy comparison, not exact equality
- **Storing full component references in DB:** Store widget IDs, resolve to components at render time
- **Fetching all data then filtering:** Only fetch data for widgets the user can see

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role hierarchy comparison | String comparison | `getRoleLevel()` utility | VIEWER < EDITOR < ADMIN ordering |
| Singleton admin defaults | Check + insert | Prisma `upsert` | Atomic, no race conditions |
| Widget visibility logic | Inline conditionals | `canViewWidget()` utility | Centralized, testable, consistent |
| JSON field typing | `any` casts | Zod schemas with type inference | Runtime validation + compile-time types |
| Default layout generation | Hardcoded per role | Generate from registry | Single source of truth |

**Key insight:** Role-based access control seems simple but has subtle bugs (hierarchy ordering, admin override vs default, caching). Centralize all permission logic in `permissions.ts`.

## Common Pitfalls

### Pitfall 1: Client-Side Only Security
**What goes wrong:** Users with browser devtools can see hidden widgets' data
**Why it happens:** Rendering widgets conditionally but still passing data to page
**How to avoid:** Filter data fetching server-side; don't even send restricted data to client
**Warning signs:** All dashboard data visible in Network tab regardless of role

### Pitfall 2: Role String Comparison Bugs
**What goes wrong:** `role === 'Admin'` fails because DB stores 'ADMIN'
**Why it happens:** Case mismatch between TypeScript enum and comparison
**How to avoid:** Always use `UserRole.ADMIN` enum values from Prisma
**Warning signs:** Permission checks failing inconsistently

### Pitfall 3: AdminDefaults Not Initialized
**What goes wrong:** Dashboard crashes on first load for new deployment
**Why it happens:** No AdminDefaults row exists; `findFirst()` returns null
**How to avoid:** Use `upsert` pattern that creates row if missing
**Warning signs:** "Cannot read property 'widgetRoles' of null" errors

### Pitfall 4: Stale Cached Permissions
**What goes wrong:** Admin updates role restrictions but users see old permissions
**Why it happens:** Aggressive caching of adminDefaults
**How to avoid:** Use `revalidatePath()` when updating admin defaults; consider short TTL
**Warning signs:** Permission changes don't take effect immediately

### Pitfall 5: Circular Widget Dependencies
**What goes wrong:** Widget A depends on Widget B's data, but B is hidden
**Why it happens:** Data dependencies not tracked in registry
**How to avoid:** Document `dataKey` dependencies; fetch data independently per widget
**Warning signs:** "undefined is not iterable" when certain widgets hidden

## Code Examples

Verified patterns from official sources:

### API Route for Admin to Update Widget Roles
```typescript
// src/app/api/admin/dashboard/roles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { updateAdminDefaults, getAdminDefaults } from '@/lib/widgets/defaults'
import { WidgetRoleRestrictions } from '@/types/dashboard'
import { WIDGET_REGISTRY } from '@/lib/widgets/registry'
import { revalidatePath } from 'next/cache'

// GET: Fetch current widget role restrictions
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const defaults = await getAdminDefaults()
  return NextResponse.json({
    widgetRoles: defaults.widgetRoles,
    widgets: Object.values(WIDGET_REGISTRY).map(w => ({
      id: w.id,
      title: w.title,
      category: w.category,
      defaultMinRole: w.minRole,
    })),
  })
}

// PUT: Update widget role restrictions
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const widgetRoles = body.widgetRoles as WidgetRoleRestrictions

    // Validate all widget IDs exist
    for (const widgetId of Object.keys(widgetRoles)) {
      if (!WIDGET_REGISTRY[widgetId]) {
        return NextResponse.json(
          { error: `Unknown widget: ${widgetId}` },
          { status: 400 }
        )
      }
    }

    await updateAdminDefaults({ widgetRoles })

    // Invalidate dashboard cache
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating widget roles:', err)
    return NextResponse.json(
      { error: 'Failed to update widget roles' },
      { status: 500 }
    )
  }
}
```

### Extended Dashboard Types
```typescript
// src/types/dashboard.ts (additions)
import { UserRole } from '@prisma/client'

export interface WidgetConfig {
  id: string       // Widget type identifier (e.g., 'revenue', 'pipeline')
  x: number        // Grid position X
  y: number        // Grid position Y
  w: number        // Width in grid units
  h: number        // Height in grid units
}

export interface DashboardLayout {
  widgets: WidgetConfig[]
}

export interface DateFilter {
  startDate: string | null
  endDate: string | null
  preset?: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom'
}

export interface WidgetRoleRestrictions {
  [widgetId: string]: UserRole[]  // widgetId -> array of allowed roles
}

// NEW: Widget definition for registry
export interface WidgetDefinition {
  id: string
  title: string
  description: string
  defaultSize: { w: number; h: number }
  minRole: UserRole
  category: 'kri' | 'crm' | 'financials'
  dataKey?: string
}

// NEW: Admin dashboard settings response
export interface AdminDashboardSettings {
  dashboardLayout: DashboardLayout
  widgetRoles: WidgetRoleRestrictions
}
```

### Server Action for Saving User Preferences
```typescript
// src/lib/actions/dashboard-actions.ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/types/dashboard'
import { filterWidgetsByRole } from '@/lib/widgets/permissions'
import { getAdminDefaults } from '@/lib/widgets/defaults'
import { revalidatePath } from 'next/cache'

export async function saveUserDashboardLayout(layout: DashboardLayout) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const adminDefaults = await getAdminDefaults()

  // Validate that user only includes widgets they can see
  const allowedWidgetIds = filterWidgetsByRole(
    layout.widgets.map(w => w.id),
    session.user.role,
    adminDefaults.widgetRoles
  )

  const validLayout: DashboardLayout = {
    widgets: layout.widgets.filter(w => allowedWidgetIds.includes(w.id))
  }

  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: { dashboardLayout: validLayout as any },
    create: {
      userId: session.user.id,
      dashboardLayout: validLayout as any,
    },
  })

  revalidatePath('/')
  return { success: true }
}

export async function getUserDashboardLayout(): Promise<DashboardLayout | null> {
  const session = await auth()
  if (!session) return null

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
    select: { dashboardLayout: true },
  })

  if (!prefs?.dashboardLayout) return null

  return prefs.dashboardLayout as unknown as DashboardLayout
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded role checks | Registry + permission utilities | Best practice 2024+ | Maintainable, testable |
| Client-side hiding | Server-side filtering | Security standard | No data leakage |
| Multiple admin settings rows | Singleton with upsert | Prisma best practice | No race conditions |
| Middleware-only auth | Multi-layer (middleware + component + API) | CVE-2025-29927 | Defense in depth |

**Deprecated/outdated:**
- Middleware-only authorization: Vulnerable to bypass (CVE-2025-29927); always verify in API routes too
- `@types/react-grid-layout`: Now bundled with react-grid-layout v2 (for Phase 24)

## Open Questions

Things that couldn't be fully resolved:

1. **Caching strategy for AdminDefaults**
   - What we know: Data rarely changes, but must update when admin modifies
   - What's unclear: Optimal cache TTL; whether to use React cache() or unstable_cache()
   - Recommendation: Start with no caching, add `revalidatePath('/')` on updates; optimize later if needed

2. **Widget-specific data fetching**
   - What we know: Current dashboard fetches all data in one go
   - What's unclear: Whether to refactor to per-widget data fetching for efficiency
   - Recommendation: Keep existing pattern for Phase 23; optimize in Phase 24 with lazy loading

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis - Prisma schema, auth-utils.ts, dashboard components
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control) - Role in session pattern
- [Prisma JSON fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - JSON field patterns

### Secondary (MEDIUM confidence)
- [Medium: Factory Registry Pattern in TypeScript](https://medium.com/@lalitpradhan306/factory-registry-pattern-96c97408c971) - Registry pattern
- [Frontend Masters: Type Registry Pattern](https://frontendmasters.com/courses/typescript-v4/type-registry-pattern/) - TypeScript registry typing
- [Medium: Building RBAC in Next.js](https://medium.com/@muhebollah.diu/building-a-scalable-role-based-access-control-rbac-system-in-next-js-b67b9ecfe5fa) - Server-side enforcement

### Tertiary (LOW confidence)
- WebSearch results for dashboard customization patterns - Community best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture patterns: HIGH - Based on existing codebase patterns and established TypeScript patterns
- Permissions logic: HIGH - Verified against Auth.js documentation and existing requireRole pattern
- Pitfalls: MEDIUM - Based on common RBAC implementation issues and CVE-2025-29927

**Research date:** 2026-01-23
**Valid until:** 60 days (stable patterns, no major version changes expected)
