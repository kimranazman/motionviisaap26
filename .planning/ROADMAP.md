# Roadmap: SAAP 2026 v2

## Milestones

- **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20) - [archive](.planning/milestones/v1.1-ROADMAP.md)
- **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22) - [archive](.planning/milestones/v1.1-ROADMAP.md)
- **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22) - [archive](.planning/milestones/v1.2-ROADMAP.md)
- **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23) - [archive](.planning/milestones/v1.2.1-ROADMAP.md)
- **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (shipped 2026-01-24) - [archive](.planning/milestones/v1.3-v1.3.2-ROADMAP.md)
- **v1.3.1 Revenue Model Refinement** - Phase 26 (shipped 2026-01-24) - [archive](.planning/milestones/v1.3.2-ROADMAP.md)
- **v1.3.2 Conversion Visibility & Archive** - Phases 27-28 (shipped 2026-01-24) - [archive](.planning/milestones/v1.3.2-ROADMAP.md)
- **v1.4 Intelligent Automation & Organization** - Phases 29-35 (shipped 2026-01-25) - [archive](.planning/milestones/v1.4-ROADMAP.md)
- **v1.4.1 Line Item Categorization** - Phase 36 (shipped 2026-01-25) - [archive](.planning/milestones/v1.4-ROADMAP.md)
- **v1.4.2 UI Polish & Bug Fixes** - Phase 37 (shipped 2026-01-26) - [archive](.planning/milestones/v1.4.2-ROADMAP.md)
- **v1.5 Initiative Intelligence & Export** - Phases 38-42 (shipped 2026-01-26) - [archive](.planning/milestones/v1.5-ROADMAP.md)
- **v1.5.1 Site Audit Fixes & Detail View Preferences** - Phases 43-45 (shipped 2026-01-27) - [archive](.planning/milestones/v1.5.1-ROADMAP.md)
- **v2.0 OKR Restructure & Support Tasks** - Phases 46-53 (shipped 2026-01-27) - [archive](.planning/milestones/v2.0-ROADMAP.md)
- **v2.1 Navigation & Views** - Phases 54-56 (shipped 2026-01-28) - [archive](.planning/milestones/v2.1-ROADMAP.md)
- **v2.2 Bug Fixes & UX Polish** - Phases 57-61 (shipped 2026-01-28) - [archive](.planning/milestones/v2.2-ROADMAP.md)
- **v2.3 CRM & UX Improvements** - Phases 62-67 (shipped 2026-01-28) - [archive](.planning/milestones/v2.3-ROADMAP.md)
- **v2.4 Settings, Sidebar & Bug Fixes** - Phases 68-71 (shipped 2026-01-28) - [archive](.planning/milestones/v2.4-ROADMAP.md)
- **v2.5 Navigation Reorganization** - Phases 72-74 (shipped 2026-01-28) - [archive](.planning/milestones/v2.5-ROADMAP.md)
- **v2.6 Views & Calendar Enhancement** - Phases 75-78 (shipped 2026-01-29) - [archive](.planning/milestones/v2.6-ROADMAP.md)
- **v2.7 Services Pricing History** - Phase 79 (shipped 2026-01-29) - [archive](.planning/milestones/v2.7-ROADMAP.md)
- 🚧 **v2.8 AI Analyze Button** - Phases 80-83 (in progress)

## v2.8 AI Analyze Button

Add a UI button in the header that triggers Claude Code's /ai-analyze command on the Mac via SSH from the NAS deployment. Admin-only, with pending count badge, dropdown menu, and hybrid polling for completion feedback.

### Phase 80: SSH Setup & Test

**Goal:** Verify NAS can SSH to Mac and run Claude without password prompt.

**Depends on:** None (infrastructure prerequisite)

**Requirements covered:**
- INFRA-01: SSH from NAS to Mac works without password
- INFRA-02: Claude command executes successfully on Mac via SSH

**Success criteria:**
- [ ] Mac has Remote Login enabled (System Settings → General → Sharing)
- [ ] Mac's local IP address documented
- [ ] SSH key generated on NAS and copied to Mac
- [ ] `ssh khairul@<mac-ip> "echo hello"` works without password
- [ ] `ssh khairul@<mac-ip> "cd /path/to/saap && claude --version"` executes successfully

**Notes:**
- Manual setup phase, no code changes
- Document Mac IP and SSH config for future reference
- Test from NAS Docker container (not just NAS shell)

---

### Phase 81: Pending Count API Enhancement

**Goal:** Extend /api/ai/pending to return granular counts for badge display.

**Depends on:** None

**Requirements covered:**
- API-01: GET /api/ai/pending returns costs count
- API-02: GET /api/ai/pending returns deliverables count
- API-03: Response includes structured object

**Success criteria:**
- [ ] API returns `{ costs, invoices, receipts, deliverables, total }` structure
- [ ] Costs count: costs with supplierId but no normalizedItem
- [ ] Invoices count: documents with category INVOICE and aiStatus PENDING
- [ ] Receipts count: documents with category RECEIPT and aiStatus PENDING
- [ ] Deliverables count: documents without aiExtracted deliverables (projects with invoices but no deliverables)
- [ ] Total is sum of all counts

**Files:**
- Modify: `src/app/api/ai/pending/route.ts`

---

### Phase 82: AI Trigger API (SSH to Mac)

**Goal:** Create endpoint that SSHs to Mac and runs Claude /ai-analyze command.

**Depends on:** Phase 80 (SSH must work)

**Requirements covered:**
- TRIG-01: POST /api/ai/trigger accepts type parameter
- TRIG-02: Endpoint SSHs to Mac and runs Claude command
- TRIG-03: Admin-only access
- TRIG-04: SSH errors return 500 with message
- TRIG-05: Environment variables for config

**Success criteria:**
- [ ] POST /api/ai/trigger with `{ type: "costs" }` triggers Claude on Mac
- [ ] Returns 403 for non-admin users
- [ ] Returns 202 Accepted on successful trigger
- [ ] Returns 500 with error message if SSH fails
- [ ] Reads MAC_SSH_HOST and MAC_PROJECT_PATH from environment
- [ ] Works from NAS Docker container

**Files:**
- Create: `src/app/api/ai/trigger/route.ts`
- Update: `.env.example` with new variables

---

### Phase 83: AiAnalyzeButton Component

**Goal:** Create header button with dropdown, badge, and polling.

**Depends on:** Phase 81 (pending counts), Phase 82 (trigger API)

**Requirements covered:**
- UI-01 through UI-06: Header button, badge, dropdown, toasts
- POLL-01 through POLL-05: Hybrid polling with completion feedback

**Success criteria:**
- [ ] Sparkles icon button appears in header for admin users only
- [ ] Badge shows total pending count (0 = hidden badge)
- [ ] Dropdown shows: All (N), Costs (N), Invoices (N), Receipts (N), Deliverables (N)
- [ ] Clicking option triggers POST to /api/ai/trigger
- [ ] Toast shows "Analyzing..." on trigger
- [ ] Error toast shows if SSH fails (API returns 500)
- [ ] After trigger, poll /api/ai/pending every 15s
- [ ] Stop polling after 90s max
- [ ] If count decreased → success toast "X items analyzed"
- [ ] If timeout with no change → info toast "Still running on Mac"
- [ ] Badge refreshes during polling

**Files:**
- Create: `src/components/layout/ai-analyze-button.tsx`
- Modify: `src/components/layout/header.tsx`

---

## Phases

<details>
<summary>v1.0 through v2.7 (Phases 1-79) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

</details>

### v2.8 AI Analyze Button (Phases 80-83)

- [x] Phase 80: SSH Setup & Test — INFRA-01, INFRA-02 (documented, requires manual enable)
- [x] Phase 81: Pending Count API Enhancement — API-01, API-02, API-03
- [ ] Phase 82: AI Trigger API (SSH to Mac) — TRIG-01 to TRIG-05
- [x] Phase 83: AiAnalyzeButton Component — UI-01 to UI-06, POLL-01 to POLL-05

## Progress

Phase 83 of 83 | v2.8 in progress

Progress: [##########] 100% (83/83 phases complete, pending Phase 82 trigger API)

---
*Roadmap created: 2026-01-29*
*Last updated: 2026-01-29 after v2.8 milestone started*
