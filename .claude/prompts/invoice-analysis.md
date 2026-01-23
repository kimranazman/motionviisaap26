# Invoice Analysis Prompt

This prompt analyzes invoice documents for the SAAP 2026 application. It extracts financial data from invoices and outputs structured JSON that can be imported into the app.

## Input

**Document Path:** The invoice document to analyze (PDF or image file)

**Project Context:** Read `manifest.json` in the same project folder for:
- Project details (title, company, dates)
- Existing cost categories and their IDs
- Document metadata (ID, filename, category)

## Process

1. **Read the invoice document** (PDF or image)
   - For PDFs: Extract text and examine visual layout
   - For images: Use visual analysis to read text

2. **Extract vendor/seller information**
   - Company name
   - Address (if visible)
   - Contact details (if visible)

3. **Extract invoice metadata**
   - Invoice number
   - Invoice date
   - Due date (if present)
   - Payment terms (if present)

4. **Extract ALL line items**
   - Description of item/service
   - Quantity (if specified)
   - Unit price (if specified)
   - Line total amount

5. **Calculate totals**
   - Subtotal (sum of line items)
   - Tax amount (if separate)
   - Total amount (final payable)

6. **Assign confidence levels**
   - Based on text clarity and parsing certainty
   - Per-line-item and overall document confidence

## Confidence Rules

| Level | Criteria |
|-------|----------|
| **HIGH** | Clear text, unambiguous values, standard invoice format |
| **MEDIUM** | Some OCR artifacts, values parseable but with minor uncertainty |
| **LOW** | Unclear text, estimated values, partially visible, or handwritten |

**Confidence assignment:**
- Start with HIGH confidence
- Downgrade to MEDIUM if: blurry text, unusual format, minor inconsistencies
- Downgrade to LOW if: handwritten amounts, partially obscured, significant uncertainty

## Output Format

Return a JSON object matching this exact schema:

```json
{
  "documentId": "string - from manifest.json document ID",
  "confidence": "HIGH | MEDIUM | LOW",
  "invoiceNumber": "string or null",
  "invoiceDate": "YYYY-MM-DD format or null",
  "vendor": "string - vendor/seller name or null",
  "lineItems": [
    {
      "description": "string - item/service description",
      "quantity": "number or null - if specified",
      "unitPrice": "number or null - if specified",
      "amount": "number - REQUIRED - line total",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "subtotal": "number or null - sum before tax",
  "tax": "number or null - tax amount if separate",
  "total": "number - REQUIRED - final total amount",
  "notes": "string - any observations about the extraction",
  "warnings": ["array of strings - any issues encountered"]
}
```

**Required fields:** `documentId`, `confidence`, `lineItems`, `total`
**All amounts:** Use numeric values without currency symbols

## Edge Cases

### Multi-page invoices
- Extract data from ALL pages
- Combine line items from all pages
- Use totals from final page

### Handwritten amounts
- Mark those specific line items as LOW confidence
- Include in warnings: "Handwritten amount detected"
- Extract best estimate of the value

### Foreign currency
- Use original currency values (do not convert)
- Note currency in warnings: "Foreign currency: USD"
- App will handle currency display

### Missing totals
- If no total shown, sum all line items
- Add warning: "Total calculated from line items"
- Mark overall confidence as MEDIUM at best

### Tax handling
- If tax is included in line items, set `tax: null`
- If tax is shown separately, extract to `tax` field
- Note in warnings if tax handling is unclear

### Partial/unclear items
- Extract what is readable
- Use "UNKNOWN" for completely illegible descriptions
- Mark those items as LOW confidence

## Example Output

```json
{
  "documentId": "doc_abc123",
  "confidence": "HIGH",
  "invoiceNumber": "INV-2026-0042",
  "invoiceDate": "2026-01-15",
  "vendor": "ABC Supplies Sdn Bhd",
  "lineItems": [
    {
      "description": "Office Chairs (Ergonomic)",
      "quantity": 5,
      "unitPrice": 450.00,
      "amount": 2250.00,
      "confidence": "HIGH"
    },
    {
      "description": "Delivery and Installation",
      "quantity": 1,
      "unitPrice": 150.00,
      "amount": 150.00,
      "confidence": "HIGH"
    }
  ],
  "subtotal": 2400.00,
  "tax": 144.00,
  "total": 2544.00,
  "notes": "Standard commercial invoice with clear formatting",
  "warnings": []
}
```

## Usage

```bash
# Analyze a single invoice
claude "Read .claude/prompts/invoice-analysis.md and analyze uploads/projects/proj123/invoice.pdf"

# With explicit manifest reference
claude "Read .claude/prompts/invoice-analysis.md, read uploads/projects/proj123/manifest.json for context, then analyze uploads/projects/proj123/invoice.pdf"
```

---

*Prompt version: 1.0*
*For: SAAP 2026 AI Document Intelligence*
