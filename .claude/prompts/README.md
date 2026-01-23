# AI Document Analysis Prompts

Prompt templates for Claude Code to analyze invoices and receipts in SAAP 2026 projects.

## Overview

These prompts enable AI-powered document analysis:

| Prompt | Purpose |
|--------|---------|
| `invoice-analysis.md` | Analyze single invoice documents |
| `receipt-analysis.md` | Analyze single receipt documents |
| `bulk-analysis.md` | Process all pending documents across projects |

## Quick Start

### Single Invoice Analysis

```bash
claude "Read .claude/prompts/invoice-analysis.md and analyze uploads/projects/PROJ_ID/invoice.pdf"
```

### Single Receipt Analysis

```bash
claude "Read .claude/prompts/receipt-analysis.md and analyze uploads/projects/PROJ_ID/receipt.jpg"
```

### Bulk Analysis (All Projects)

```bash
claude "Read .claude/prompts/bulk-analysis.md and process uploads/projects/"
```

## Prerequisites

Before running AI analysis:

1. **Documents uploaded** - Upload documents via app UI
2. **Categories assigned** - Set document category to INVOICE or RECEIPT
3. **Manifests generated** - Generate via app (Review and Import button) or API:
   ```
   POST /api/projects/{id}/manifest
   ```

## Workflow

```
1. Upload documents     --> App stores in uploads/projects/{id}/
2. Categorize docs      --> Set as INVOICE, RECEIPT, or OTHER
3. Generate manifest    --> Creates context file for AI
4. Run Claude analysis  --> AI reads docs, outputs structured JSON
5. Import results       --> App reads ai-results.json, shows review UI
6. Confirm import       --> Creates cost entries with AI badge
```

## Output Files

AI analysis creates these files in project folders:

| File | Created By | Purpose |
|------|------------|---------|
| `manifest.json` | App | Project context for AI |
| `ai-results.json` | Claude Code | Extracted data from documents |

## Output Handling

After running analysis:

1. **Results location:** `uploads/projects/{projectId}/ai-results.json`
2. **Import via app:** Click "Review and Import" button in project documents
3. **Review extractions:** Check amounts, categories, confidence levels
4. **Edit if needed:** Fix any incorrect extractions inline
5. **Confirm import:** Creates cost entries marked as "AI-imported"

## Confidence Levels

AI assigns confidence levels to extractions:

| Level | Badge Color | Meaning |
|-------|-------------|---------|
| HIGH | Green | Clear text, unambiguous values |
| MEDIUM | Yellow | Some uncertainty, review recommended |
| LOW | Red | Unclear, manual verification required |

**Auto-import behavior:**
- HIGH confidence items can be auto-selected for import
- MEDIUM/LOW confidence items require manual review

## Troubleshooting

### Document analysis fails

- **Check document quality:** Blurry/faded documents may fail
- **Check category:** Must be INVOICE or RECEIPT (OTHER skipped)
- **Check manifest:** Ensure manifest.json exists in project folder

### Wrong category suggested

- Edit in review UI before importing
- Categories can be changed per-item

### Missing line items

- Check `warnings` array in results for issues
- LOW confidence indicates partial extraction
- Manual entry may be needed for unclear items

### No results file created

- Verify Claude Code completed without errors
- Check if documents are categorized (not OTHER)
- Ensure manifest.json exists

## Prompt Customization

Prompts can be edited for specific needs:

- **Category rules:** Modify category matching in `receipt-analysis.md`
- **Confidence thresholds:** Adjust criteria in any prompt
- **Output format:** Add fields as needed (maintain backwards compatibility)

## Version

Prompt version: 1.0
Compatible with: SAAP 2026 v1.3+

---

*For SAAP 2026 AI Document Intelligence (Phase 25)*
