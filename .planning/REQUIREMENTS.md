# Requirements: SAAP 2026 v2 — v2.8 AI Analyze Button

**Defined:** 2026-01-29
**Core Value:** Admin can trigger AI analysis from the SAAP UI, leveraging Claude Code on Mac via SSH

## v1 Requirements

Requirements for v2.8 release. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: SSH from NAS to Mac works without password
- [ ] **INFRA-02**: Claude command executes successfully on Mac via SSH

### Pending API

- [ ] **API-01**: GET /api/ai/pending returns costs count (costs with supplierId but no normalizedItem)
- [ ] **API-02**: GET /api/ai/pending returns deliverables count (documents without aiExtracted deliverables)
- [ ] **API-03**: Response includes structured object: { costs, invoices, receipts, deliverables, total }

### Trigger API

- [ ] **TRIG-01**: POST /api/ai/trigger accepts type parameter (all, costs, invoice, receipt, deliverables)
- [ ] **TRIG-02**: Endpoint SSHs to Mac and runs Claude /ai-analyze command
- [ ] **TRIG-03**: Admin-only access (role check)
- [ ] **TRIG-04**: SSH errors return 500 with error message
- [ ] **TRIG-05**: Environment variables for SSH host and project path

### UI Component

- [ ] **UI-01**: Header button with Sparkles icon (admin-only visibility)
- [ ] **UI-02**: Badge showing total pending count
- [ ] **UI-03**: Dropdown menu with options: All, Costs, Invoices, Receipts, Deliverables
- [ ] **UI-04**: Each dropdown item shows count for that type
- [ ] **UI-05**: Toast feedback on trigger click ("Analyzing..." message)
- [ ] **UI-06**: Error toast when SSH fails

### Polling

- [ ] **POLL-01**: After trigger, poll pending count every 15 seconds
- [ ] **POLL-02**: Stop polling after 90 seconds max
- [ ] **POLL-03**: If count decreased, show success toast with items analyzed
- [ ] **POLL-04**: If timeout with no change, show "Still running on Mac" info toast
- [ ] **POLL-05**: Badge refreshes during polling

## v2 Requirements

Deferred to future release.

### Future Enhancements

- **FUT-01**: Run Claude Code directly on NAS (remove SSH dependency)
- **FUT-02**: Real-time log streaming from Claude to UI
- **FUT-03**: Analysis history with timestamps and results

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Run Claude on NAS directly | Requires Docker Claude Code setup; SSH to Mac is simpler for now |
| Real-time progress updates | Fire-and-forget with polling is sufficient |
| Analysis scheduling (cron) | Manual trigger is fine for 3-person team |
| Multiple Mac targets | Single Mac is sufficient |
| Analysis queue management | One-at-a-time is fine |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 80 | Pending |
| INFRA-02 | Phase 80 | Pending |
| API-01 | Phase 81 | Pending |
| API-02 | Phase 81 | Pending |
| API-03 | Phase 81 | Pending |
| TRIG-01 | Phase 82 | Pending |
| TRIG-02 | Phase 82 | Pending |
| TRIG-03 | Phase 82 | Pending |
| TRIG-04 | Phase 82 | Pending |
| TRIG-05 | Phase 82 | Pending |
| UI-01 | Phase 83 | Pending |
| UI-02 | Phase 83 | Pending |
| UI-03 | Phase 83 | Pending |
| UI-04 | Phase 83 | Pending |
| UI-05 | Phase 83 | Pending |
| UI-06 | Phase 83 | Pending |
| POLL-01 | Phase 83 | Pending |
| POLL-02 | Phase 83 | Pending |
| POLL-03 | Phase 83 | Pending |
| POLL-04 | Phase 83 | Pending |
| POLL-05 | Phase 83 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after initial definition*
