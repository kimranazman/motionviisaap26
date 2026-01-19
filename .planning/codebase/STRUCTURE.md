# Codebase Structure

**Analysis Date:** 2026-01-20

## Directory Layout

```
saap2026v2/
├── prisma/                    # Database schema and migrations
│   └── schema.prisma          # Prisma ORM schema
├── public/                    # Static assets
├── src/                       # Application source code
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Route Handlers
│   │   │   ├── dashboard/
│   │   │   │   └── stats/
│   │   │   ├── events-to-attend/
│   │   │   └── initiatives/
│   │   │       ├── [id]/
│   │   │       │   └── comments/
│   │   │       └── reorder/
│   │   ├── (dashboard)/       # Dashboard route group
│   │   │   ├── calendar/
│   │   │   ├── events/
│   │   │   ├── initiatives/
│   │   │   ├── kanban/
│   │   │   └── timeline/
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── calendar/          # Calendar view components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── events/            # Events-to-attend components
│   │   ├── initiatives/       # Initiative CRUD components
│   │   ├── kanban/            # Kanban board components
│   │   ├── layout/            # Layout components (header, sidebar)
│   │   ├── timeline/          # Gantt chart components
│   │   └── ui/                # shadcn/ui primitives
│   └── lib/                   # Shared utilities
│       ├── prisma.ts          # Prisma client singleton
│       └── utils.ts           # Helper functions
├── .env                       # Environment variables (local)
├── .env.example               # Environment template
├── .env.nas                   # NAS deployment config
├── components.json            # shadcn/ui configuration
├── docker-compose.yml         # Docker development setup
├── docker-compose.nas.yml     # Docker NAS deployment
├── Dockerfile                 # Container build
├── deploy.sh                  # Deployment script
├── next.config.mjs            # Next.js configuration
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Directory Purposes

**`prisma/`**
- Purpose: Database schema definition and seed data
- Contains: `schema.prisma` with models, enums, relations
- Key files: `schema.prisma`, `seed.ts` (if present)

**`src/app/`**
- Purpose: Next.js App Router pages and API routes
- Contains: Route definitions, layouts, page components
- Key files: `layout.tsx` (root), `(dashboard)/layout.tsx` (dashboard shell)

**`src/app/api/`**
- Purpose: REST API endpoints for client-side mutations
- Contains: Route handler files (`route.ts`)
- Naming: Directory structure maps to URL paths

**`src/app/(dashboard)/`**
- Purpose: Dashboard pages with shared layout (sidebar)
- Contains: Feature pages (kanban, timeline, initiatives, etc.)
- Key files: `layout.tsx` (wraps with Sidebar)

**`src/components/ui/`**
- Purpose: Base UI primitives from shadcn/ui
- Contains: Button, Card, Dialog, Select, Table, etc.
- Pattern: Radix UI + CVA variants + Tailwind

**`src/components/[feature]/`**
- Purpose: Feature-specific composed components
- Contains: Components used only within that feature
- Examples: `kanban/kanban-board.tsx`, `dashboard/kpi-cards.tsx`

**`src/components/layout/`**
- Purpose: Shell/layout components
- Contains: `header.tsx`, `sidebar.tsx`
- Used by: Dashboard layout and pages

**`src/lib/`**
- Purpose: Shared utilities and configurations
- Contains: Prisma client, utility functions
- Key files: `prisma.ts` (DB client), `utils.ts` (helpers)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout, HTML structure, font
- `src/app/(dashboard)/layout.tsx`: Dashboard shell with Sidebar
- `src/app/(dashboard)/page.tsx`: Dashboard home page

**Configuration:**
- `tsconfig.json`: TypeScript settings, path aliases
- `tailwind.config.ts`: Tailwind theme, animations
- `next.config.mjs`: Next.js settings (minimal)
- `components.json`: shadcn/ui component config
- `.env`: Database URL, environment settings

**Core Logic:**
- `src/lib/prisma.ts`: Prisma client singleton
- `src/lib/utils.ts`: Formatters, color maps, option constants

**Database:**
- `prisma/schema.prisma`: Data models and relations

**Testing:**
- No test directory detected

## Naming Conventions

**Files:**
- `kebab-case.tsx` for all components: `kanban-board.tsx`, `kpi-cards.tsx`
- `kebab-case.ts` for utilities: `utils.ts`
- `route.ts` for API handlers (Next.js convention)
- `page.tsx` for pages (Next.js convention)
- `layout.tsx` for layouts (Next.js convention)

**Directories:**
- `kebab-case` for feature directories: `events-to-attend/`, `dashboard/`
- `[param]` for dynamic routes: `[id]/`
- `(group)` for route groups: `(dashboard)/`

**Components:**
- PascalCase exports: `KanbanBoard`, `InitiativesList`
- File name matches primary export: `kanban-board.tsx` exports `KanbanBoard`

**Functions:**
- camelCase for functions: `getInitiatives`, `formatDate`
- Prefix async data fetchers with `get`: `getDashboardData()`

**Types/Interfaces:**
- PascalCase: `Initiative`, `KanbanBoardProps`
- Suffix props with `Props`: `HeaderProps`, `InitiativesListProps`

## Where to Add New Code

**New Feature Page:**
1. Create directory in `src/app/(dashboard)/[feature-name]/`
2. Add `page.tsx` with Server Component
3. Add data fetching function in page
4. Create components in `src/components/[feature-name]/`
5. Pass serialized data to Client Components

**New API Endpoint:**
1. Create directory in `src/app/api/[resource]/`
2. Add `route.ts` with HTTP method handlers
3. Import prisma from `@/lib/prisma`
4. For nested resources: `[parent]/[id]/[child]/route.ts`

**New UI Component:**
1. Use `npx shadcn@latest add [component]` for primitives
2. Components land in `src/components/ui/`
3. Import from `@/components/ui/[component]`

**New Feature Component:**
1. Create file in `src/components/[feature]/[component-name].tsx`
2. Use `'use client'` directive if interactive
3. Import UI primitives from `@/components/ui/`
4. Import utilities from `@/lib/utils`

**New Utility Function:**
1. Add to `src/lib/utils.ts`
2. Export function with JSDoc comment
3. For formatting/display: follow existing patterns (formatX, getXColor)

**New Database Model:**
1. Add to `prisma/schema.prisma`
2. Run `npx prisma db push` or migration
3. Run `npx prisma generate`
4. Create API routes in `src/app/api/[model]/`

## Special Directories

**`node_modules/`**
- Purpose: npm dependencies
- Generated: Yes (npm install)
- Committed: No (in .gitignore)

**`.next/`**
- Purpose: Next.js build output
- Generated: Yes (next build/dev)
- Committed: No (in .gitignore)

**`.planning/`**
- Purpose: GSD planning and codebase documentation
- Generated: By GSD tools
- Committed: Yes

**`public/`**
- Purpose: Static assets served at root
- Generated: No
- Committed: Yes

## Import Aliases

**Configured in `tsconfig.json`:**
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

**Usage:**
- `@/components/ui/button` -> `src/components/ui/button.tsx`
- `@/lib/utils` -> `src/lib/utils.ts`
- `@/lib/prisma` -> `src/lib/prisma.ts`

## Route Structure

**Dashboard Routes (under `(dashboard)/`):**
| Path | File | Purpose |
|------|------|---------|
| `/` | `page.tsx` | Dashboard home with KPIs |
| `/kanban` | `kanban/page.tsx` | Kanban board view |
| `/timeline` | `timeline/page.tsx` | Gantt chart view |
| `/calendar` | `calendar/page.tsx` | Calendar view |
| `/initiatives` | `initiatives/page.tsx` | Initiatives list |
| `/events` | `events/page.tsx` | Events to attend |

**API Routes:**
| Path | Method(s) | Purpose |
|------|-----------|---------|
| `/api/initiatives` | GET, POST | List/create initiatives |
| `/api/initiatives/[id]` | GET, PUT, PATCH, DELETE | Single initiative CRUD |
| `/api/initiatives/[id]/comments` | GET, POST | Initiative comments |
| `/api/initiatives/reorder` | PATCH | Kanban drag-drop reorder |
| `/api/events-to-attend` | GET, PATCH | Events listing/status |
| `/api/dashboard/stats` | GET | Dashboard statistics |

---

*Structure analysis: 2026-01-20*
