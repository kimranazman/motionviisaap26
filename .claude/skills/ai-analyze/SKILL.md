---
name: ai-analyze
description: Analyze pending items using Claude - cost categorization, document extraction, deliverables
user_invocable: true
---

# AI Analyze Skill

This skill uses Claude Code to analyze various pending items in SAAP that would otherwise require separate AI services.

## Usage

```
/ai-analyze [type]
```

Where `type` is one of:
- `costs` - Normalize cost item descriptions
- `invoice` - Extract data from invoice documents
- `receipt` - Extract data from receipt documents
- `deliverables` - Extract deliverables from quotes

If no type specified, shows a summary of pending items.

## Workflow

### Cost Categorization (`/ai-analyze costs`)

1. Query database for costs with `supplierId` but no `normalizedItem`
2. For each cost, analyze the `description` following rules in `instructions/cost-categorization.md`
3. Update the `normalizedItem` field via the normalize API

### Document Analysis (`/ai-analyze invoice` or `/ai-analyze receipt`)

1. Query for pending documents of that type
2. Read the document content/image
3. Extract structured data following the relevant instruction file
4. Create or update records based on extracted data

### Deliverable Extraction (`/ai-analyze deliverables`)

1. Query for quotes without extracted deliverables
2. Parse quote content following `instructions/deliverable-extraction.md`
3. Create deliverable records linked to the quote

## Instructions

Each analysis type has detailed instructions in the `instructions/` folder:
- `cost-categorization.md` - How to normalize cost item names
- `document-invoice.md` - How to extract invoice data
- `document-receipt.md` - How to extract receipt data
- `deliverable-extraction.md` - How to extract deliverables from quotes

## Implementation Notes

When running this skill:
1. Read the relevant instruction file first
2. Query the database for pending items
3. Process each item following the instruction rules
4. Use the appropriate API endpoint to save results
5. Report summary of processed items

## API Endpoints

- `PATCH /api/costs/{id}/normalize` - Update normalizedItem for a cost
- Database queries via Prisma for finding pending items
