# SAAP2026v2

## What This Is

Strategic Annual Action Plan (SAAP) application for Motionvii to track 2026 business initiatives. A visual planning tool with Kanban boards, Gantt timelines, and calendar views for a small team (Khairul, Azlan, Izyani) to manage strategic objectives, key results, and action items.

## Core Value

Team can visualize and track initiative progress across multiple views (Kanban, timeline, calendar) and update status through intuitive drag-and-drop.

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

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
- ✓ Global search with debounced popover results — v1
- ✓ Notification bell with badge count and grouped alerts — v1
- ✓ Initiative detail page (/initiatives/[id]) with inline editing — v1
- ✓ Comments on initiative detail page — v1
- ✓ Kanban quick action "Change Status" — v1
- ✓ Kanban quick action "Reassign" — v1
- ✓ Clean navigation (no dead links) — v1

### Active

<!-- Current scope. Building toward these. -->

(Starting v2 milestone)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time collaboration — single user typically, not needed
- Mobile app — web-first, responsive design sufficient
- Email notifications — overkill for 3-person team

## Context

- Internal tool for Motionvii team (3 people)
- Deployed on Synology DS925+ NAS via Docker
- Accessible at https://saap.motionvii.com (Cloudflare tunnel)
- Data seeded from Excel file (MotionVii_SAAP_2026.xlsx)
- 28 initiatives, 38 events currently in database
- No authentication — currently trusted network access only

## Constraints

- **Tech stack**: Next.js 14, Prisma, MariaDB, Tailwind/shadcn — established, don't change
- **Deployment**: Must work on NAS with low CPU priority (nice -n 19)
- **Team size**: 3 hardcoded team members (Khairul, Azlan, Izyani) in Prisma enum
- **No new dependencies**: Prefer using existing UI components over adding libraries

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing detail sheet for quick edits | Avoid duplicate UI, sheet already works well | ✓ Good |
| Full detail page for comprehensive view | Some workflows need full-page context | ✓ Good |
| Remove auth UI vs disable | Cleaner UX, auth coming in dedicated milestone | ✓ Good |
| Notifications as popover not page | Quick glance, not a separate view | ✓ Good |

---
*Last updated: 2026-01-21 after v1 milestone archived*
