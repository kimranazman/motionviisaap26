# Technology Stack

**Analysis Date:** 2025-01-20

## Languages

**Primary:**
- TypeScript ^5 - All application code (`src/`, `prisma/seed.ts`)
- TSX - React components

**Secondary:**
- JavaScript (ESM) - Configuration files (`next.config.mjs`, `postcss.config.mjs`)
- SQL - Database via Prisma ORM

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Specified in `Dockerfile`
- npm - Package manager

**Package Manager:**
- npm (lockfile v3)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js ^14.2.28 - Full-stack React framework with App Router
  - Config: `next.config.mjs`
  - Output mode: `standalone` (optimized for Docker)
  - Server Actions enabled

**UI:**
- React ^18 - UI library
- Tailwind CSS ^3.4.1 - Utility-first CSS
  - Config: `tailwind.config.ts`
  - Plugin: `tailwindcss-animate` for animations
- shadcn/ui (new-york style) - Component library
  - Config: `components.json`
  - Icon library: Lucide React

**Database:**
- Prisma ^6.19.2 - ORM
  - Schema: `prisma/schema.prisma`
  - Client: `@prisma/client`

**Testing:**
- None configured

**Build/Dev:**
- ESLint ^8 - Linting
  - Config: `.eslintrc.json` (extends `next/core-web-vitals`, `next/typescript`)
- PostCSS ^8 - CSS processing
- ts-node ^10.9.2 - TypeScript execution for seed script

## Key Dependencies

**Critical:**
- `next` ^14.2.28 - Application framework
- `@prisma/client` ^6.19.2 - Database ORM
- `react` ^18 - UI rendering

**UI Components (Radix UI primitives):**
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-select` - Select inputs
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-popover` - Popovers
- `@radix-ui/react-tooltip` - Tooltips
- `@radix-ui/react-progress` - Progress bars
- `@radix-ui/react-avatar` - Avatar components
- `@radix-ui/react-scroll-area` - Scrollable areas
- `@radix-ui/react-separator` - Dividers

**Drag and Drop:**
- `@dnd-kit/core` ^6.3.1 - DnD foundation
- `@dnd-kit/sortable` ^10.0.0 - Sortable lists
- `@dnd-kit/utilities` ^3.2.2 - DnD utilities

**Data Visualization:**
- `recharts` ^3.6.0 - Charts library

**Date Handling:**
- `date-fns` ^4.1.0 - Date utilities
- `react-day-picker` ^9.13.0 - Date picker component

**Data Import:**
- `xlsx` ^0.18.5 - Excel file parsing (used in seed script)

**Styling Utilities:**
- `class-variance-authority` ^0.7.1 - Variant-based styling
- `clsx` ^2.1.1 - Conditional classes
- `tailwind-merge` ^3.4.0 - Merge Tailwind classes
- `lucide-react` ^0.562.0 - Icons

## Configuration

**Environment:**
- `DATABASE_URL` - MySQL/MariaDB connection string (required)
- `NODE_ENV` - development/production
- Files: `.env`, `.env.example`, `.env.nas`

**TypeScript:**
- Config: `tsconfig.json`
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Module resolution: bundler
- JSX: preserve (for Next.js)

**Tailwind:**
- Config: `tailwind.config.ts`
- Dark mode: class-based
- CSS variables for theming (shadcn/ui pattern)
- Custom color tokens for semantic colors

**shadcn/ui:**
- Config: `components.json`
- Style: new-york
- RSC enabled
- Base color: neutral

**Build:**
- Next.js standalone output for Docker deployment
- Prisma client generated at build time

## Platform Requirements

**Development:**
- Node.js 20+
- MySQL 8+ or MariaDB 10.11+
- Docker (optional, for local containers)

**Production:**
- Docker with docker-compose
- MariaDB 10.11 (containerized)
- NAS deployment target (Synology)
  - Port 3002 (app)
  - Port 3308 (database)

**Deployment:**
- Docker multi-stage build
- `docker-compose.yml` - Standard deployment
- `docker-compose.nas.yml` - NAS-optimized deployment
- `deploy.sh` - Automated deployment script
- Cloudflare tunnel for public access (planned)

---

*Stack analysis: 2025-01-20*
