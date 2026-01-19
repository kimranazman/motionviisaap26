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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Global search actually filters initiatives
- [ ] Notification bell shows overdue/at-risk initiatives with dynamic count
- [ ] Initiative detail page (/initiatives/[id]) with full view
- [ ] Initiative edit page (/initiatives/[id]/edit) or inline editing
- [ ] Kanban quick action "Change Status" works
- [ ] Kanban quick action "Reassign" works
- [ ] Remove dead Settings link from sidebar
- [ ] Remove/disable non-functional auth UI (Profile, Settings, Logout menu items)
- [ ] Fix all dead links pointing to non-existent routes

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Authentication/authorization — planned for future milestone, internal tool for now
- Settings page — requires auth, defer until auth milestone
- Real-time collaboration — single user typically, not needed
- Mobile app — web-first, responsive design sufficient
- Email notifications — overkill for 3-person team

## Context

- Internal tool for Motionvii team (3 people)
- Deployed on Synology DS925+ NAS via Docker
- Accessible at https://saap.motionvii.com (Cloudflare tunnel)
- Data seeded from Excel file (MotionVii_SAAP_2026.xlsx)
- 28 initiatives, 38 events currently in database
- No authentication — trusted network access only

## Constraints

- **Tech stack**: Next.js 14, Prisma, MariaDB, Tailwind/shadcn — established, don't change
- **Deployment**: Must work on NAS with low CPU priority (nice -n 19)
- **Team size**: 3 hardcoded team members (Khairul, Azlan, Izyani) in Prisma enum
- **No new dependencies**: Prefer using existing UI components over adding libraries

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing detail sheet for quick edits | Avoid duplicate UI, sheet already works well | — Pending |
| Full detail page for comprehensive view | Some workflows need full-page context | — Pending |
| Remove auth UI vs disable | Cleaner UX, auth coming in dedicated milestone | — Pending |
| Notifications as popover not page | Quick glance, not a separate view | — Pending |

---
*Last updated: 2026-01-20 after initialization*
