# Bulk Analysis Prompt

This prompt processes multiple projects at once, analyzing all pending documents across projects. It coordinates invoice and receipt analysis and aggregates results.

## Input

**Base Directory:** `uploads/projects/` - the directory containing all project folders

**Optional Filter:** Specific project IDs to process (if not provided, process all)

## Process

1. **Scan for projects with pending documents**
   ```
   For each folder in uploads/projects/:
     - Check if manifest.json exists
     - Read manifest.json
     - Check if pendingAnalysis array has documents
     - Skip if no pending documents
   ```

2. **For each project with pending documents:**
   ```
   a. Read manifest.json for project context
   b. For each document in pendingAnalysis:
      - If category = "INVOICE": Apply invoice-analysis.md rules
      - If category = "RECEIPT": Apply receipt-analysis.md rules
      - If category = "OTHER": Skip (cannot auto-analyze)
   c. Collect results for the project
   ```

3. **Apply appropriate analysis:**
   - **INVOICE documents:** Extract vendor, line items, totals (see invoice-analysis.md)
   - **RECEIPT documents:** Extract merchant, items with categories (see receipt-analysis.md)
   - **OTHER documents:** Skip with note in errors array

4. **Aggregate results per project**

5. **Save results to project folder**

## Output Format (AIAnalysisResult)

For each project, save a JSON file with this structure:

```json
{
  "version": "1.0",
  "analyzedAt": "2026-01-24T10:30:00Z",
  "projectId": "proj_abc123",
  "invoices": [
    {
      "documentId": "doc_inv001",
      "confidence": "HIGH",
      "invoiceNumber": "INV-2026-0042",
      "invoiceDate": "2026-01-15",
      "vendor": "ABC Supplies Sdn Bhd",
      "lineItems": [
        {
          "description": "Office Chairs",
          "quantity": 5,
          "unitPrice": 450.00,
          "amount": 2250.00,
          "confidence": "HIGH"
        }
      ],
      "subtotal": 2250.00,
      "tax": 135.00,
      "total": 2385.00,
      "notes": "Clear invoice",
      "warnings": []
    }
  ],
  "receipts": [
    {
      "documentId": "doc_rcp001",
      "confidence": "HIGH",
      "merchant": "ACE Hardware",
      "receiptDate": "2026-01-20",
      "items": [
        {
          "description": "PVC Pipes",
          "amount": 45.00,
          "suggestedCategory": "Materials",
          "suggestedCategoryId": "cat_materials",
          "confidence": "HIGH"
        }
      ],
      "total": 45.00,
      "paymentMethod": "card",
      "notes": null,
      "warnings": []
    }
  ],
  "errors": [
    {
      "documentId": "doc_other001",
      "error": "Document category is OTHER - cannot auto-analyze"
    }
  ]
}
```

## Output Location

Save results to: `uploads/projects/{projectId}/ai-results.json`

One file per project, in the project's own folder.

## Progress Reporting

During execution, log progress:

```
[1/5] Processing project: Project Alpha (proj_abc123)
  - Analyzing invoice: invoice-001.pdf ... done (HIGH confidence)
  - Analyzing receipt: receipt-001.jpg ... done (MEDIUM confidence)
  - Skipping OTHER: contract.pdf
  - Saved: uploads/projects/proj_abc123/ai-results.json

[2/5] Processing project: Project Beta (proj_def456)
  ...

Summary:
  Projects processed: 5
  Documents analyzed: 12
  - Invoices: 4
  - Receipts: 8
  Errors/skipped: 3
  Results saved to: ai-results.json in each project folder
```

## Handling Failures

### Document analysis fails
- Add to `errors` array with error description
- Continue processing other documents
- Mark document as failed but don't halt batch

### Manifest missing or invalid
- Skip the project
- Log: "Skipping project {id}: manifest.json missing or invalid"

### No pending documents
- Skip the project (nothing to do)
- Don't create/overwrite ai-results.json

## Usage

```bash
# Analyze all projects with pending documents
claude "Read .claude/prompts/bulk-analysis.md and process uploads/projects/"

# Analyze specific projects only
claude "Read .claude/prompts/bulk-analysis.md and process only these projects in uploads/projects/: proj_abc123, proj_def456"

# From app directory root
claude "Read .claude/prompts/bulk-analysis.md and analyze all pending documents in uploads/projects/"
```

## Pre-requisites

Before running bulk analysis:

1. **Manifests must exist** - Generate via app (POST /api/projects/{id}/manifest)
2. **Documents uploaded** - Documents must be in project folders
3. **Categories assigned** - Documents should have INVOICE or RECEIPT category

---

*Prompt version: 1.0*
*For: SAAP 2026 AI Document Intelligence*
