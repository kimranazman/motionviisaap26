# SAAP 2026 - Claude Code Instructions

## Project Overview

SAAP (Sales And Admin Platform) 2026 - A Next.js application for project management, cost tracking, and document analysis for Motionvii/Talenta.

## Custom Commands

### `/ai-analyze [type]`

Analyze pending items using Claude. Types:

| Type | What it does |
|------|--------------|
| (none) | Show summary of pending items |
| `costs` | Normalize cost descriptions for supplier items |
| `invoice` | Extract data from invoice documents |
| `receipt` | Extract data from receipt documents |
| `deliverables` | Extract deliverables from quotes/invoices |

**Usage:**
```
/ai-analyze              # Show what needs analysis
/ai-analyze costs        # Normalize cost item names
/ai-analyze deliverables # Extract deliverables from documents
```

**Workflow:**
1. Query database for pending items (costs without normalizedItem, documents with aiStatus=PENDING)
2. Read instruction files from `.claude/skills/ai-analyze/instructions/`
3. Analyze each item following the rules
4. Save via appropriate API endpoint
5. Report summary

**Instruction Files:**
- `.claude/skills/ai-analyze/instructions/cost-categorization.md` - Normalization rules
- `.claude/skills/ai-analyze/instructions/document-invoice.md` - Invoice extraction
- `.claude/skills/ai-analyze/instructions/document-receipt.md` - Receipt extraction
- `.claude/skills/ai-analyze/instructions/deliverable-extraction.md` - Deliverable extraction

**API Endpoints:**
- `PATCH /api/costs/{id}/normalize` - Update normalizedItem
- `POST /api/ai/import/invoice` - Import invoice extraction
- `POST /api/ai/import/receipt` - Import receipt extraction
- `POST /api/ai/import/deliverable` - Import deliverables

### `/bulk-analyze`

Process all pending documents across all projects. See `.claude/prompts/bulk-analysis.md` for details.

## Key Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities and shared logic
- `uploads/projects/{id}/` - Project documents and AI results
- `.claude/prompts/` - AI analysis prompt templates
- `.claude/skills/ai-analyze/instructions/` - Analysis instruction files

## Database

PostgreSQL with Prisma ORM. Key models:
- `Project` - Projects with revenue tracking
- `Cost` - Cost entries with optional supplier and normalizedItem
- `Document` - Uploaded documents with aiStatus tracking
- `Deliverable` - Project deliverables (can be aiExtracted)
- `Supplier` - Suppliers for cost tracking

## Conventions

- Use Prisma for all database operations
- Cost amounts are Decimal, convert to Number for JSON responses
- Documents use aiStatus: PENDING → ANALYZED → IMPORTED
- AI-imported items have aiExtracted/aiImported flags
