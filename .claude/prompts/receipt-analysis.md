# Receipt Analysis Prompt

This prompt analyzes receipt documents for expense tracking in the SAAP 2026 application. It extracts purchase data and suggests cost categories for import.

## Input

**Document Path:** The receipt document to analyze (PDF or image file)

**Project Context:** Read `manifest.json` in the same project folder for:
- Project details (title, company, dates)
- Existing cost categories with their IDs (for category matching)
- Document metadata (ID, filename, category)

## Process

1. **Read the receipt document** (PDF or image)
   - For PDFs: Extract text and examine visual layout
   - For images: Use visual analysis to read text
   - Handle thermal receipt format (narrow, long)

2. **Extract merchant/store information**
   - Store/merchant name
   - Location/branch (if visible)
   - Contact details (if visible)

3. **Extract receipt metadata**
   - Receipt/transaction date
   - Receipt number (if present)
   - Time of purchase (if present)

4. **Extract items or total**
   - Individual line items if itemized
   - Single total if no itemization available
   - Include quantity and unit price where visible

5. **Match items to cost categories**
   - Use existing categories from manifest
   - Apply category matching rules (see below)
   - Assign confidence based on match certainty

6. **Extract payment information**
   - Payment method (cash, card, transfer)
   - Card last 4 digits (if visible, for reference only)

## Category Matching Rules

Match receipt items to these standard cost categories:

| Category | Match When Item Contains |
|----------|--------------------------|
| **Labor** | Staff meals, personnel costs, hiring fees, salaries, wages |
| **Materials** | Physical supplies, equipment, tools, raw materials, parts, consumables |
| **Vendors** | Third-party services, contractors, subcontractors, professional fees |
| **Travel** | Transport, fuel, parking, tolls, accommodation, meals during travel |
| **Software** | Licenses, subscriptions, digital services, SaaS, apps, cloud services |
| **Other** | Anything that doesn't clearly fit above categories |

**Matching logic:**
1. Check item description keywords against category patterns
2. Consider merchant type (e.g., hardware store -> Materials)
3. When confident, include `suggestedCategoryId` from manifest
4. When uncertain, set category to "Other" with LOW confidence

## Confidence Rules

| Level | Criteria |
|-------|----------|
| **HIGH** | Clear text, unambiguous values, obvious category match |
| **MEDIUM** | Readable but with some uncertainty, reasonable category guess |
| **LOW** | Unclear text, estimated values, uncertain category |

**Confidence assignment:**
- Start with HIGH if text is clear and format standard
- Downgrade to MEDIUM if: faded thermal print, minor ambiguity
- Downgrade to LOW if: significant portions unclear, handwritten

## Output Format

Return a JSON object matching this exact schema:

```json
{
  "documentId": "string - from manifest.json document ID",
  "confidence": "HIGH | MEDIUM | LOW",
  "merchant": "string - store/merchant name or null",
  "receiptDate": "YYYY-MM-DD format or null",
  "items": [
    {
      "description": "string - item description",
      "amount": "number - REQUIRED - item cost",
      "suggestedCategory": "string - category name",
      "suggestedCategoryId": "string - category ID from manifest or null",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "total": "number - REQUIRED - receipt total",
  "paymentMethod": "cash | card | transfer | null",
  "notes": "string - any observations about the extraction",
  "warnings": ["array of strings - any issues encountered"]
}
```

**Required fields:** `documentId`, `confidence`, `items`, `total`
**All amounts:** Use numeric values without currency symbols

## Edge Cases

### Single total (no itemization)
- Create ONE item with the full amount
- Set description to merchant name + "purchase"
- Example: "ACE Hardware purchase"
- Mark category confidence as MEDIUM (less context)

### Multiple items same category
- Keep items separate (don't combine)
- Each item gets its own entry
- Allows for line-by-line review

### Unclear category match
- Use "Other" as the suggested category
- Set that item's confidence to LOW
- Note in warnings: "Category unclear for: [item]"

### Faded thermal receipts
- Extract what is readable
- Use "UNKNOWN" for illegible items
- Mark overall confidence as LOW
- Add warning: "Faded thermal receipt - some items unclear"

### Split payments
- Record primary payment method
- Note split in warnings: "Split payment detected"
- Total should reflect full receipt amount

### Discounts and taxes
- Include discounts in individual item amounts if itemized
- If total includes separate tax line, note in warnings
- Use final amounts after all adjustments

### Foreign language receipts
- Extract amounts (numbers are universal)
- Transliterate or describe items best effort
- Mark confidence as MEDIUM at best
- Note language in warnings

## Example Output

```json
{
  "documentId": "doc_xyz789",
  "confidence": "HIGH",
  "merchant": "ACE Hardware Sdn Bhd",
  "receiptDate": "2026-01-20",
  "items": [
    {
      "description": "PVC Pipe 1/2 inch (10 pcs)",
      "amount": 45.00,
      "suggestedCategory": "Materials",
      "suggestedCategoryId": "cat_materials",
      "confidence": "HIGH"
    },
    {
      "description": "Pipe Fittings Assorted",
      "amount": 32.50,
      "suggestedCategory": "Materials",
      "suggestedCategoryId": "cat_materials",
      "confidence": "HIGH"
    },
    {
      "description": "Work Gloves",
      "amount": 18.90,
      "suggestedCategory": "Materials",
      "suggestedCategoryId": "cat_materials",
      "confidence": "HIGH"
    }
  ],
  "total": 96.40,
  "paymentMethod": "card",
  "notes": "Hardware store receipt with clear itemization",
  "warnings": []
}
```

### Example: Single Total Only

```json
{
  "documentId": "doc_abc456",
  "confidence": "MEDIUM",
  "merchant": "Shell Station Kajang",
  "receiptDate": "2026-01-18",
  "items": [
    {
      "description": "Shell Station Kajang - fuel purchase",
      "amount": 120.00,
      "suggestedCategory": "Travel",
      "suggestedCategoryId": "cat_travel",
      "confidence": "MEDIUM"
    }
  ],
  "total": 120.00,
  "paymentMethod": "card",
  "notes": "Fuel receipt - single total only",
  "warnings": ["No itemization available - single total extracted"]
}
```

## Usage

```bash
# Analyze a single receipt
claude "Read .claude/prompts/receipt-analysis.md and analyze uploads/projects/proj123/receipt.jpg"

# With explicit manifest reference
claude "Read .claude/prompts/receipt-analysis.md, read uploads/projects/proj123/manifest.json for context, then analyze uploads/projects/proj123/receipt.jpg"
```

---

*Prompt version: 1.0*
*For: SAAP 2026 AI Document Intelligence*
