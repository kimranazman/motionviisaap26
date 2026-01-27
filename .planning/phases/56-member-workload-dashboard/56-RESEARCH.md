# Phase 56: Member Workload Dashboard - Research

**Researched:** 2026-01-28
**Domain:** Cross-model member workload aggregation with overview and detail pages
**Confidence:** HIGH

## Summary

This phase creates a `/members` overview page showing 3 team member cards with aggregated workload counts, and a `/members/[name]` detail page showing all work items (KRs, initiatives, tasks, support tasks) assigned to that member. The core challenge is aggregating data across 4 distinct Prisma models that use different field names and types to represent "owner/assignee."

The codebase has all building blocks needed:
- **TeamMember enum** (KHAIRUL, AZLAN, IZYANI) used by Initiative.personInCharge, Initiative.accountable, and Task.assignee
- **String owner fields** on KeyResult.owner and SupportTask.owner (title-case values: "Khairul", "Azlan", "Izyani")
- **Existing UI patterns:** Card grids (support-tasks-view), Progress bars (key-result-group), Badge status displays (initiatives-list), Table views (task-table-view), Avatar with team colors (team-workload.tsx)
- **Nav config** already has `{ name: 'Members', href: '/members', icon: Users2 }` in `topLevelItems`
- **TeamWorkload component** (`src/components/dashboard/team-workload.tsx`) with TEAM_COLORS and TEAM_INITIALS constants

The primary complexity is the owner field type mismatch: Initiative and Task use the `TeamMember` enum (uppercase), while KeyResult and SupportTask use free-text strings (title-case). A normalization function is required for unified aggregation.

**Primary recommendation:** Build `/members` and `/members/[name]` as server-component pages that query all 4 models, normalize owner fields into TeamMember enum values, and pass aggregated data to client components. No new API routes needed -- all data is fetched server-side via Prisma.

## Standard Stack

No new dependencies required. Everything needed is already installed.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@prisma/client` | 6.19.2 | Database queries across 4 models | Only ORM in the project |
| `next` | 15.x | App Router pages, server components | Project framework |
| `date-fns` | 4.1.0 | Date comparison for overdue detection | Already used throughout |
| `lucide-react` | 0.562.0 | Icons (Target, Briefcase, ListChecks, etc.) | Project standard |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui `Card` | local | Member overview cards, section cards | Member cards and detail sections |
| shadcn/ui `Progress` | local | KR progress bars | KR section on detail page |
| shadcn/ui `Badge` | local | Status badges, KR badges, count badges | Everywhere |
| shadcn/ui `Avatar` | local | Member avatars with initials | Overview cards and detail header |
| shadcn/ui `Table` | local | Task and initiative lists | Detail page sections |
| `@radix-ui/react-progress` | installed | Underlying Progress component | Via shadcn/ui Progress |

### No New Dependencies Needed
The project does NOT need any charting library, data table library, or state management. All views are server-fetched data rendered in standard components.

**Installation:**
```bash
# Nothing to install -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (dashboard)/
      members/
        page.tsx                      # Server component: fetch aggregated counts, render MembersOverview
        [name]/
          page.tsx                    # Server component: fetch member detail data, render MemberDetail
  components/
    members/                          # NEW directory
      members-overview.tsx            # Client component: 3 member cards grid
      member-card.tsx                 # Individual member card with avatar, name, counts
      member-detail.tsx               # Client component: detail page layout with sections
      member-stats-header.tsx         # Summary statistics bar at top of detail
      member-kr-section.tsx           # Key Results section with progress bars
      member-initiatives-section.tsx  # Initiatives section (personInCharge)
      member-accountable-section.tsx  # Accountable For section (accountable field)
      member-tasks-section.tsx        # Cross-project tasks section
      member-support-tasks-section.tsx # Support tasks section
  lib/
    member-utils.ts                   # NEW: normalizeOwner(), MEMBER_PROFILES, status breakdown helpers
```

### Pattern 1: Server Component Pages with Multi-Model Queries
**What:** Each page is a server component that queries multiple Prisma models in parallel and passes serialized data to client components.
**When to use:** Both the overview page and detail page.
**Example:**
```typescript
// src/app/(dashboard)/members/page.tsx
// Source: Pattern from src/app/(dashboard)/objectives/page.tsx
export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { MembersOverview } from '@/components/members/members-overview'
import { MEMBER_PROFILES } from '@/lib/member-utils'

async function getMemberCounts() {
  // Query all 4 models in parallel
  const [initiatives, tasks, keyResults, supportTasks] = await Promise.all([
    prisma.initiative.findMany({
      select: { personInCharge: true, accountable: true, status: true },
    }),
    prisma.task.findMany({
      where: { parentId: null },
      select: { assignee: true, status: true },
    }),
    prisma.keyResult.findMany({
      select: { owner: true, status: true },
    }),
    prisma.supportTask.findMany({
      select: { owner: true, priority: true },
    }),
  ])

  // Aggregate per member
  return MEMBER_PROFILES.map(member => ({
    ...member,
    counts: {
      keyResults: keyResults.filter(kr =>
        kr.owner.toUpperCase() === member.enumValue
      ).length,
      initiatives: initiatives.filter(i =>
        i.personInCharge === member.enumValue
      ).length,
      tasks: tasks.filter(t =>
        t.assignee === member.enumValue
      ).length,
      supportTasks: supportTasks.filter(st =>
        st.owner.toUpperCase() === member.enumValue
      ).length,
    },
  }))
}
```

### Pattern 2: Member Detail with Parallel Model Queries
**What:** The detail page queries each model filtered by member, returning full data for each section.
**When to use:** `/members/[name]` page.
**Example:**
```typescript
// src/app/(dashboard)/members/[name]/page.tsx
// Source: Pattern from src/app/(dashboard)/initiatives/[id]/page.tsx

async function getMemberData(memberEnum: string, memberName: string) {
  const [keyResults, initiatives, accountableInitiatives, tasks, supportTasks] = await Promise.all([
    // KRs: string match on owner field (case-insensitive via toUpperCase comparison)
    prisma.keyResult.findMany({
      where: { owner: { equals: memberName, mode: 'insensitive' } },
      orderBy: { krId: 'asc' },
    }),
    // Initiatives where personInCharge (enum match)
    prisma.initiative.findMany({
      where: { personInCharge: memberEnum as any },
      include: { keyResult: { select: { id: true, krId: true } } },
      orderBy: { sequenceNumber: 'asc' },
    }),
    // Initiatives where accountable (enum match, distinct from personInCharge)
    prisma.initiative.findMany({
      where: {
        accountable: memberEnum as any,
        NOT: { personInCharge: memberEnum as any },
      },
      include: { keyResult: { select: { id: true, krId: true } } },
      orderBy: { sequenceNumber: 'asc' },
    }),
    // Tasks across all projects (enum match)
    prisma.task.findMany({
      where: { assignee: memberEnum as any, parentId: null },
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    // Support tasks: string match on owner field
    prisma.supportTask.findMany({
      where: { owner: { equals: memberName, mode: 'insensitive' } },
      include: {
        keyResultLinks: {
          include: { keyResult: { select: { id: true, krId: true, description: true } } },
        },
      },
      orderBy: [{ category: 'asc' }, { taskId: 'asc' }],
    }),
  ])

  return { keyResults, initiatives, accountableInitiatives, tasks, supportTasks }
}
```

### Pattern 3: Owner Field Normalization
**What:** A mapping utility that bridges TeamMember enum values and string owner fields.
**When to use:** Any time you need to match a team member across different models.
**Example:**
```typescript
// src/lib/member-utils.ts (NEW)

export interface MemberProfile {
  enumValue: string        // "KHAIRUL" (TeamMember enum)
  name: string             // "Khairul" (display name, matches KR/ST owner strings)
  slug: string             // "khairul" (URL slug for /members/[name])
  initials: string         // "KH"
  color: string            // "bg-blue-600"
}

export const MEMBER_PROFILES: MemberProfile[] = [
  { enumValue: 'KHAIRUL', name: 'Khairul', slug: 'khairul', initials: 'KH', color: 'bg-blue-600' },
  { enumValue: 'AZLAN', name: 'Azlan', slug: 'azlan', initials: 'AZ', color: 'bg-green-600' },
  { enumValue: 'IZYANI', name: 'Izyani', slug: 'izyani', initials: 'IZ', color: 'bg-purple-600' },
]

export function getMemberBySlug(slug: string): MemberProfile | undefined {
  return MEMBER_PROFILES.find(m => m.slug === slug.toLowerCase())
}

export function getMemberByEnum(enumValue: string): MemberProfile | undefined {
  return MEMBER_PROFILES.find(m => m.enumValue === enumValue)
}
```

### Pattern 4: Status Breakdown Computation
**What:** Group items by status and produce a human-readable summary like "5 In Progress, 2 Completed, 1 At Risk".
**When to use:** MBR-09 requires status breakdowns per section.
**Example:**
```typescript
// In member-utils.ts

export function getStatusBreakdown(
  items: Array<{ status: string }>,
  formatFn: (status: string) => string
): Array<{ status: string; label: string; count: number; color: string }> {
  const counts = new Map<string, number>()
  items.forEach(item => {
    counts.set(item.status, (counts.get(item.status) || 0) + 1)
  })
  return Array.from(counts.entries())
    .map(([status, count]) => ({
      status,
      label: formatFn(status),
      count,
      color: getStatusColorForBreakdown(status),
    }))
    .filter(entry => entry.count > 0)
}
```

### Pattern 5: Overdue/At-Risk Visual Highlighting
**What:** Items past due date or in AT_RISK/BEHIND status display with red accent.
**When to use:** MBR-10 across all detail sections.
**Example:**
```typescript
// Utility for checking overdue status
function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'DONE' || status === 'COMPLETED' || status === 'ACHIEVED') return false
  return new Date(dueDate) < new Date()
}

function isAtRisk(status: string): boolean {
  return status === 'AT_RISK' || status === 'BEHIND'
}

// In component:
<div className={cn(
  'p-3 rounded-lg border',
  (isOverdue(item.dueDate, item.status) || isAtRisk(item.status))
    ? 'border-red-200 bg-red-50/50'
    : 'border-gray-200'
)}>
```

### Anti-Patterns to Avoid
- **Do NOT create API routes for member data.** Server components can query Prisma directly. No client-side fetching needed since this is a read-only dashboard.
- **Do NOT try a single cross-model SQL query.** Query each model separately and merge in JavaScript. Prisma does not support cross-model joins.
- **Do NOT assume owner strings match enum values exactly.** "Khairul" !== "KHAIRUL". Always normalize before comparing.
- **Do NOT make member pages dynamic/editable.** This is a read-only workload view. No forms, no mutations, no state management for editing.
- **Do NOT use client-side data fetching (useEffect + fetch).** Follow the established server-component pattern. Data is fresh on every page load.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Member avatar with colors | Custom avatar component | `TEAM_COLORS`, `TEAM_INITIALS` from `team-workload.tsx` + shadcn Avatar | Already defined for all 3 members |
| Initiative status badges | Custom styled spans | `getStatusColor()`, `formatStatus()` from `src/lib/utils.ts` | Consistent with rest of app |
| Task status badges | Custom task badges | `getTaskStatusColor()`, `formatTaskStatus()` from `src/lib/task-utils.ts` | Matches cross-project tasks page |
| KR status badges | Custom KR badges | `getKrStatusColor()`, `formatKrStatus()` from `key-result-group.tsx` | Already defined (extract to shared util) |
| KR progress bars | Custom progress | shadcn Progress + `getProgressBarColor()` from `key-result-group.tsx` | Matches objectives page display |
| Team member display names | Custom formatting | `formatTeamMember()` from `src/lib/utils.ts` | Already standardized |
| Date formatting | Custom date logic | `formatDate()`, `formatDateRange()` from `src/lib/utils.ts` | Already used everywhere |
| Support task category labels | Custom mappings | `CATEGORY_LABELS`, `CATEGORY_COLORS` from `support-tasks-view.tsx` | Consistent with support tasks page |
| Task priority colors | Custom priority display | `getTaskPriorityColor()`, `formatTaskPriority()` from `task-utils.ts` | Consistent badges |

**Key insight:** Every visual element needed (badges, progress bars, avatars, cards) already exists in the codebase. The member pages are purely a new aggregation of existing data and display patterns. Extract shared constants (TEAM_COLORS, TEAM_INITIALS, KR status colors) to `member-utils.ts` to avoid importing from component files.

## Common Pitfalls

### Pitfall 1: Owner Field Type Mismatch
**What goes wrong:** KeyResult.owner and SupportTask.owner are free-text strings ("Khairul"), while Initiative.personInCharge and Task.assignee are TeamMember enum values ("KHAIRUL"). Direct equality comparison fails.
**Why it happens:** Schema design decision -- KR/ST owner fields were kept as strings per requirements (owners might include external stakeholders).
**How to avoid:** Create `MEMBER_PROFILES` constant with both `enumValue` and `name` properties. For KR/ST queries, use Prisma's `mode: 'insensitive'` on the `equals` filter. For in-memory filtering, compare `owner.toUpperCase() === member.enumValue`.
**Warning signs:** Member shows 0 KRs or 0 support tasks when they actually own some. Verify by checking query results match expected data from the research docs (Khairul: 5/6 KRs, 16 STs; Azlan: 1 KR, 14 STs; Izyani: 0 KRs, 0 STs).

### Pitfall 2: URL Slug to Member Mapping
**What goes wrong:** The `/members/[name]` route uses a URL slug ("khairul"), but database queries need different formats -- TeamMember enum ("KHAIRUL") or owner string ("Khairul").
**Why it happens:** Three different representations of the same person across the system.
**How to avoid:** Use `getMemberBySlug()` to resolve the slug to a MemberProfile object, then use `profile.enumValue` for Initiative/Task queries and `profile.name` for KR/ST queries. Return 404 if slug doesn't match any member.
**Warning signs:** Page shows empty data because wrong format was used in query.

### Pitfall 3: Accountable vs PersonInCharge Double-Counting
**What goes wrong:** A member might be both `personInCharge` AND `accountable` for the same initiative. If both sections are shown without deduplication, the initiative appears twice, inflating workload perception.
**Why it happens:** The requirement (MBR-11) asks for a SEPARATE "Accountable For" section, distinct from the personInCharge section.
**How to avoid:** For the "Accountable For" section, query with `accountable: memberEnum AND NOT personInCharge: memberEnum` to exclude initiatives already shown in the personInCharge section. For overview counts, decide whether "initiatives" count includes accountable or just personInCharge (recommendation: only personInCharge for the count, with accountable shown as a separate count).
**Warning signs:** Same initiative appearing in both sections on the detail page.

### Pitfall 4: Serializing Prisma Decimals and Dates
**What goes wrong:** Prisma returns `Decimal` objects for KeyResult fields (target, actual, progress, weight) and `Date` objects for timestamps. Passing these directly to client components causes serialization errors.
**Why it happens:** Server components can't pass non-serializable objects to client components.
**How to avoid:** Always serialize: `Number(kr.target)` for Decimals, `date.toISOString()` for Dates. The existing codebase does this consistently (see objectives/page.tsx for the pattern).
**Warning signs:** "Cannot pass [object Object] as a prop" errors; NaN values in progress bars.

### Pitfall 5: Empty State for Members with No Items
**What goes wrong:** Izyani likely has 0 KRs and 0 support tasks (per research data). Sections rendering empty without explanation look broken.
**Why it happens:** Not all members have items in all categories.
**How to avoid:** Each section should have a clear empty state message: "No key results owned by [Name]". The overview card should still show the member even with 0 counts.
**Warning signs:** Blank sections on member detail page with no explanation.

### Pitfall 6: KR Deadline is a String, Not a Date
**What goes wrong:** KeyResult.deadline is stored as a free-text string ("Q4 2026", "Dec 2026"), not a parseable DateTime. Attempting `new Date(kr.deadline)` produces Invalid Date, breaking overdue detection.
**Why it happens:** The deadline field was intentionally designed as flexible text since KR deadlines are quarterly, not exact dates.
**How to avoid:** Do NOT apply overdue highlighting to KR items based on deadline. Only use the `status` field (AT_RISK, BEHIND) for KR highlighting. Overdue detection only applies to Initiative dates and Task dueDate which are proper DateTime fields.
**Warning signs:** Invalid Date errors, NaN in date comparisons, all KRs showing as "overdue".

### Pitfall 7: MySQL Case Sensitivity with Prisma `mode: 'insensitive'`
**What goes wrong:** The project uses MySQL. Prisma's `mode: 'insensitive'` on string comparison may not work as expected depending on MySQL collation. The Prisma schema declares `datasource db { provider = "mysql" }`.
**Why it happens:** MySQL with utf8mb4_general_ci collation is already case-insensitive by default for comparisons. But Prisma might generate different SQL depending on the provider.
**How to avoid:** Two options: (1) Use exact match with the known title-case value from MEMBER_PROFILES (`where: { owner: member.name }` without mode), since the seed data uses consistent title case. (2) If unsure, use `mode: 'insensitive'` as a safety net -- it works fine with MySQL. Recommendation: use exact match with known values for clarity.
**Warning signs:** Empty results when querying by owner name.

## Code Examples

### Member Overview Page (Server Component)
```typescript
// src/app/(dashboard)/members/page.tsx
// Source: Pattern from src/app/(dashboard)/support-tasks/page.tsx
export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { MembersOverview } from '@/components/members/members-overview'
import { MEMBER_PROFILES } from '@/lib/member-utils'

async function getMemberOverviewData() {
  const [initiatives, tasks, keyResults, supportTasks] = await Promise.all([
    prisma.initiative.groupBy({
      by: ['personInCharge'],
      _count: true,
    }),
    prisma.task.groupBy({
      by: ['assignee'],
      where: { parentId: null },
      _count: true,
    }),
    prisma.keyResult.findMany({
      select: { owner: true },
    }),
    prisma.supportTask.findMany({
      select: { owner: true },
    }),
  ])

  return MEMBER_PROFILES.map(member => {
    const initiativeCount = initiatives.find(
      i => i.personInCharge === member.enumValue
    )?._count || 0
    const taskCount = tasks.find(
      t => t.assignee === member.enumValue
    )?._count || 0
    const krCount = keyResults.filter(
      kr => kr.owner.toUpperCase() === member.enumValue
    ).length
    const stCount = supportTasks.filter(
      st => st.owner.toUpperCase() === member.enumValue
    ).length

    return {
      ...member,
      counts: {
        keyResults: krCount,
        initiatives: initiativeCount,
        tasks: taskCount,
        supportTasks: stCount,
      },
    }
  })
}

export default async function MembersPage() {
  const members = await getMemberOverviewData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Members" description="Team workload overview" />
      <div className="p-3 md:p-6">
        <MembersOverview members={members} />
      </div>
    </div>
  )
}
```

### Member Detail Page (Server Component)
```typescript
// src/app/(dashboard)/members/[name]/page.tsx
// Source: Pattern from src/app/(dashboard)/initiatives/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { MemberDetail } from '@/components/members/member-detail'
import { getMemberBySlug } from '@/lib/member-utils'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const member = getMemberBySlug(name)

  if (!member) {
    notFound()
  }

  // Parallel queries for all entity types
  const [keyResults, initiatives, accountableInitiatives, tasks, supportTasks] =
    await Promise.all([
      // ... queries as shown in Pattern 2 above
    ])

  // Serialize dates and decimals
  const serializedData = {
    member,
    keyResults: keyResults.map(kr => ({
      ...kr,
      target: Number(kr.target),
      actual: Number(kr.actual),
      progress: Number(kr.progress),
      weight: Number(kr.weight),
    })),
    initiatives: initiatives.map(i => ({
      ...i,
      startDate: i.startDate.toISOString(),
      endDate: i.endDate.toISOString(),
    })),
    accountableInitiatives: accountableInitiatives.map(i => ({
      ...i,
      startDate: i.startDate.toISOString(),
      endDate: i.endDate.toISOString(),
    })),
    tasks: tasks.map(t => ({
      ...t,
      dueDate: t.dueDate?.toISOString() || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    supportTasks,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={member.name}
        description={`Workload overview for ${member.name}`}
      />
      <div className="p-3 md:p-6">
        <MemberDetail data={serializedData} />
      </div>
    </div>
  )
}
```

### Member Card Component
```typescript
// src/components/members/member-card.tsx
// Source: Pattern from team-workload.tsx + support-tasks-view.tsx card
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Target, Briefcase, ListChecks, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberCardProps {
  member: {
    name: string
    slug: string
    initials: string
    color: string
    counts: {
      keyResults: number
      initiatives: number
      tasks: number
      supportTasks: number
    }
  }
}

export function MemberCard({ member }: MemberCardProps) {
  const total = member.counts.keyResults + member.counts.initiatives +
    member.counts.tasks + member.counts.supportTasks

  return (
    <Link href={`/members/${member.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={cn('text-white text-lg', member.color)}>
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{member.name}</h3>
            <p className="text-sm text-gray-500">{total} total items</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <CountBadge icon={Target} label="Key Results" count={member.counts.keyResults} />
            <CountBadge icon={Briefcase} label="Initiatives" count={member.counts.initiatives} />
            <CountBadge icon={ListChecks} label="Tasks" count={member.counts.tasks} />
            <CountBadge icon={ClipboardList} label="Support Tasks" count={member.counts.supportTasks} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

### Summary Stats Header
```typescript
// src/components/members/member-stats-header.tsx
// Pattern: Dashboard stat cards (existing pattern)

interface StatsHeaderProps {
  stats: {
    label: string
    count: number
    breakdown: Array<{ label: string; count: number; color: string }>
  }[]
}

export function MemberStatsHeader({ stats }: StatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stat.count}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
            {stat.breakdown.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {stat.breakdown.map(b => (
                  <span key={b.label} className={cn('text-xs', b.color)}>
                    {b.count} {b.label}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Overdue/At-Risk Highlighting
```typescript
// In member-utils.ts

export function isItemOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate) return false
  const completedStatuses = ['DONE', 'COMPLETED', 'ACHIEVED', 'CANCELLED']
  if (completedStatuses.includes(status)) return false
  return new Date(dueDate) < new Date()
}

export function isItemAtRisk(status: string): boolean {
  return status === 'AT_RISK' || status === 'BEHIND'
}

export function shouldHighlightRed(
  status: string,
  dueDate?: string | null
): boolean {
  return isItemAtRisk(status) || isItemOverdue(dueDate || null, status)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Data scattered across separate pages | Cross-model aggregation per member | Phase 56 (this phase) | New capability |
| Team workload only in dashboard widget | Dedicated /members pages | Phase 56 (this phase) | Deep workload visibility |
| No accountable vs personInCharge distinction | Separate "Accountable For" section | Phase 56 (this phase) | Clearer responsibility model |

**No deprecated patterns.** All existing utilities and component patterns are current and stable.

## Key Design Decisions

### 1. No API Routes Needed
**Decision:** All data is fetched server-side via Prisma in server components. No `/api/members` endpoint needed.
**Rationale:** The member pages are read-only dashboards. Server components can query Prisma directly, which is simpler and faster than creating API routes and client-side fetching. This matches the pattern used by objectives/page.tsx, initiatives/page.tsx, and support-tasks/page.tsx.

### 2. URL Slug Format
**Decision:** Use lowercase name as URL slug: `/members/khairul`, `/members/azlan`, `/members/izyani`.
**Rationale:** Clean, readable URLs. The `[name]` param is resolved via `getMemberBySlug()` which handles case-insensitive lookup. With only 3 hardcoded members, this is simpler than using database IDs.

### 3. Separate Accountable Section
**Decision:** The "Accountable For" section shows initiatives where `accountable = member AND personInCharge != member`. Initiatives where the member is BOTH are shown only in the personInCharge section.
**Rationale:** Prevents double-counting while still showing the accountable role distinctly (MBR-11).

### 4. KR Overdue Detection
**Decision:** Do NOT apply date-based overdue logic to Key Results. Only use status field (AT_RISK, BEHIND) for red highlighting.
**Rationale:** KR deadline is a free-text string ("Q4 2026"), not a parseable date. Attempting date parsing would fail silently.

### 5. Count Strategy for Overview Cards
**Decision:** Overview card "Initiatives" count includes only personInCharge, not accountable. Accountable count shown separately if needed.
**Rationale:** personInCharge represents active workload (execution). Accountable represents oversight responsibility. Mixing them inflates perceived workload.

## Open Questions

1. **Exact database owner values**
   - What we know: Seed data pulls owner strings from Excel. Research docs say values are "Khairul", "Azlan", "Izyani" (title case).
   - What's unclear: Whether any manual edits have introduced variant casing in production data.
   - Recommendation: Use case-insensitive matching (`owner.toUpperCase() === member.enumValue`) as a safety measure. This handles any casing variations without a schema change.

2. **Izyani's support tasks**
   - What we know: Research docs (v2.1-FEATURES.md) say "Azlan owns 14, Khairul owns 16" support tasks. Izyani is not mentioned.
   - What's unclear: Whether Izyani has any support tasks at all.
   - Recommendation: Handle gracefully with empty state. The UI should still render all sections for every member, showing "No support tasks" if applicable.

3. **Member navigation from detail page**
   - What we know: D-16 in v2.1-FEATURES.md mentions "Previous/Next member buttons" as a differentiator.
   - What's unclear: Whether this should be included in the core phase or deferred.
   - Recommendation: Include simple back-to-overview link. Previous/Next buttons are trivial to add (hardcoded 3-member list) but are not in the requirements list.

## Sources

### Primary (HIGH confidence)
- **Prisma schema** (`prisma/schema.prisma`) - All 4 model definitions: KeyResult (owner: String), SupportTask (owner: String), Initiative (personInCharge/accountable: TeamMember?), Task (assignee: TeamMember?)
- **TeamMember enum** - KHAIRUL, AZLAN, IZYANI (3 values)
- **KeyResultStatus enum** - NOT_STARTED, ON_TRACK, AT_RISK, BEHIND, ACHIEVED
- **InitiativeStatus enum** - NOT_STARTED, IN_PROGRESS, ON_HOLD, AT_RISK, COMPLETED, CANCELLED
- **TaskStatus enum** - TODO, IN_PROGRESS, DONE
- **Existing team-workload.tsx** (`src/components/dashboard/team-workload.tsx`) - TEAM_COLORS, TEAM_INITIALS, Avatar pattern
- **Existing support-tasks-view.tsx** (`src/components/support-tasks/support-tasks-view.tsx`) - Card grid pattern, category display
- **Existing key-result-group.tsx** (`src/components/objectives/key-result-group.tsx`) - KR status colors, progress bar display, formatKrStatus
- **Existing initiative-row.tsx** (`src/components/objectives/initiative-row.tsx`) - Initiative display with status badges
- **Existing task-table-view.tsx** (`src/components/tasks/task-table-view.tsx`) - Cross-project task table pattern (from Phase 55)
- **Nav config** (`src/lib/nav-config.ts`) - Members link already at `{ name: 'Members', href: '/members', icon: Users2 }`
- **Utils** (`src/lib/utils.ts`) - formatTeamMember, formatStatus, getStatusColor, formatDate, formatDateRange, TEAM_MEMBER_OPTIONS
- **Task utils** (`src/lib/task-utils.ts`) - formatTaskStatus, getTaskStatusColor, formatTaskPriority, getTaskPriorityColor
- **KR progress utils** (`src/lib/kr-progress-utils.ts`) - calculateObjectiveProgress

### Secondary (MEDIUM confidence)
- **v2.1-PITFALLS.md** (`.planning/research/v2.1-PITFALLS.md`) - Pitfall 4 documents owner field mismatch in detail
- **v2.1-FEATURES.md** (`.planning/research/v2.1-FEATURES.md`) - Feature specs TS-23 through TS-30, D-11 through D-16
- **Seed script** (`prisma/seed.ts`) - Owner values sourced from Excel, stored as trimmed strings

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase inspection and planning documents

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used in codebase
- Architecture: HIGH - Every pattern directly mirrors existing code (server component pages, client component views, Prisma queries)
- Pitfalls: HIGH - Owner mismatch documented in v2.1-PITFALLS.md, verified against schema and seed code
- Code examples: HIGH - Based on actual existing code patterns with specific file references

**Research date:** 2026-01-28
**Valid until:** Indefinite (based on codebase inspection and project planning documents, not external documentation)
