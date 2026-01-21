# SAAP2026v2

## What This Is

Strategic Annual Action Plan (SAAP) application for Motionvii to track 2026 business initiatives. A visual planning tool with Kanban boards, Gantt timelines, and calendar views for a small team (Khairul, Azlan, Izyani) to manage strategic objectives, key results, and action items. Now with Google OAuth authentication and role-based access control.

## Core Value

Team can visualize and track initiative progress across multiple views (Kanban, timeline, calendar) and update status through intuitive drag-and-drop — with secure access restricted to authorized @talenta.com.my users.

## Current State

**Version:** v1.1 Authentication (shipped 2026-01-22)
**Next:** Planning next milestone

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

**v1.0 MVP:**
- ✓ Dashboard with KPI summary (total initiatives, status breakdown, progress) — existing
- ✓ Kanban board with drag-and-drop status updates — existing
- ✓ Gantt timeline view showing initiative durations — existing
- ✓ Calendar view for date-based visualization — existing
- ✓ Initiatives list with filtering and search — existing
- ✓ Create/edit initiative via modal form — existing
- ✓ Delete initiative with confirmation — existing
- ✓ Comments on initiatives — existing
- ✓ Events to attend tracking — existing
- ✓ Initiative detail sheet (slide-out panel) — existing
- ✓ Filter by person, status, date range — existing
- ✓ NAS deployment with Docker — existing
- ✓ Public access via Cloudflare tunnel (saap.motionvii.com) — existing
- ✓ Global search with debounced popover results — v1.0
- ✓ Notification bell with badge count and grouped alerts — v1.0
- ✓ Initiative detail page (/initiatives/[id]) with inline editing — v1.0
- ✓ Comments on initiative detail page — v1.0
- ✓ Kanban quick action "Change Status" — v1.0
- ✓ Kanban quick action "Reassign" — v1.0
- ✓ Clean navigation (no dead links) — v1.0

**v1.1 Authentication:**
- ✓ Google OAuth login with NextAuth.js — v1.1
- ✓ Domain-restricted access (@talenta.com.my) — v1.1
- ✓ User roles (Admin, Editor, Viewer) — v1.1
- ✓ Admin user management page — v1.1
- ✓ Protected routes and API endpoints — v1.1
- ✓ Role-based UI (hide edit buttons for Viewers) — v1.1
- ✓ Comments auto-assigned to logged-in user — v1.1

### Active

<!-- Current scope. Building toward these. -->

(None — planning next milestone)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time collaboration — single user typically, not needed
- Mobile app — web-first, responsive design sufficient
- Email notifications — overkill for 3-person team
- Password authentication — Google OAuth is sufficient
- Multiple OAuth providers — Google covers all @talenta.com.my users
- Granular permissions — three-tier RBAC is sufficient for small team
- Self-service role requests — admin manually promotes, keeps it simple

## Context

- Internal tool for Motionvii team (3 people)
- Deployed on Synology DS925+ NAS via Docker
- Accessible at https://saap.motionvii.com (Cloudflare tunnel)
- Data seeded from Excel file (MotionVii_SAAP_2026.xlsx)
- 28 initiatives, 38 events currently in database
- Authentication complete (v1.1) — Google OAuth with domain restriction
- Primary admin: khairul@talenta.com.my

## Infrastructure

- **NAS IP**: 192.168.1.20
- **NAS SSH**: `ssh adminmotionvii@192.168.1.20`
- **Database**: MariaDB running in Docker on NAS, port 3307 (external) → 3306 (internal)
- **Dev connection**: `mysql://saap_user:saap_password_2026@192.168.1.20:3307/saap2026`
- **Deployment docs**: See `DEPLOYMENT.md` in project root

## Constraints

- **Tech stack**: Next.js 14, Prisma, MariaDB, Tailwind/shadcn, NextAuth.js — established, don't change
- **Deployment**: Must work on NAS with low CPU priority (nice -n 19)
- **Team size**: 3 hardcoded team members (Khairul, Azlan, Izyani) in Prisma enum
- **Minimal dependencies**: Prefer existing UI components

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing detail sheet for quick edits | Avoid duplicate UI, sheet already works well | ✓ Good |
| Full detail page for comprehensive view | Some workflows need full-page context | ✓ Good |
| Remove auth UI vs disable | Cleaner UX, auth coming in dedicated milestone | ✓ Good |
| Notifications as popover not page | Quick glance, not a separate view | ✓ Good |
| NextAuth.js v5 with JWT sessions | Edge middleware compatible, Prisma adapter | ✓ Good |
| Server-side domain validation | hd parameter alone insufficient | ✓ Good |
| Three-tier RBAC | Admin > Editor > Viewer is enough for small team | ✓ Good |
| Viewers can comment | Participation allowed, editing restricted | ✓ Good |
| Fetch role on sign-in only | Edge runtime doesn't support Prisma | ✓ Good |

---
*Last updated: 2026-01-22 after v1.1 milestone shipped*
