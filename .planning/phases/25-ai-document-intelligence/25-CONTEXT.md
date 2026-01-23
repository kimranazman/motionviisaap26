# Phase 25: AI Document Intelligence - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

AI automatically extracts financial data from invoices and receipts, calculates revenue/costs, and categorizes line items. This is Phase A (Claude Code workflow) — user runs Claude Code with prompt templates, AI analyzes documents, app imports structured results with user confirmation.

Phase B (built-in "Analyze" button with API) is future scope.

</domain>

<decisions>
## Implementation Decisions

### Review & confirmation flow
- Review happens in **slide-out sheet** (similar to ProjectDetailSheet)
- **Confidence indicators** with color-coded badges (green=high, yellow=medium, red=low)
- **Direct inline editing** — click any field to edit in the table
- **Preview changes first** — show what will be created before final commit

### Extraction display
- **Table with columns** — Description, Amount, Category, Confidence (sortable)
- **Auto-fill categories if confident** — high confidence = pre-filled, low confidence = empty dropdown for user to choose
- **Partial results with warnings** — show whatever was extracted, highlight missing/uncertain fields
- **Side-by-side layout** — document preview on left, extraction table on right in the sheet

### Manifest & prompt design
- **Prompt templates in `.claude/prompts/`** — version controlled, editable, Claude Code reads naturally
- **Manifest auto-generated on document upload** — updated whenever documents are added
- **Include base64 thumbnails** — small previews embedded in manifest for quick reference
- **Context depth** — Claude's discretion on what project context is useful for accurate extraction

### Automation vs control
- **Bulk analysis workflow** — one Claude Code command processes all projects with pending documents
- App shows "Pending AI Analysis: X projects" with ready-to-run command
- **Auto-import high confidence** extractions, low confidence needs review
- **Mark as "AI-imported"** — badge on entries for easy identification and later review
- **Document status badge** — "Analyzed" or "Pending" visible on documents

### Claude's Discretion
- What project context to include in manifest (title, company, dates, existing costs/categories)
- Exact confidence thresholds for auto-import vs review
- Prompt template wording and structure
- Error handling for unparseable documents

</decisions>

<specifics>
## Specific Ideas

- Phase A workflow: User uploads docs → manifest auto-generated → user runs Claude Code command → AI returns structured JSON → app imports and shows for confirmation
- For bulk workflows: 20 projects can be analyzed with one command
- Future Phase B: "Analyze with AI" button per document for instant results
- Entries created by AI should be distinguishable from manual entries

</specifics>

<deferred>
## Deferred Ideas

- Built-in "Analyze" button with API integration (Phase B - future)
- Automatic analysis on document upload without user trigger

</deferred>

---

*Phase: 25-ai-document-intelligence*
*Context gathered: 2026-01-24*
