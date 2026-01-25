# Invoice Document Extraction Instructions

## Purpose

Extract structured data from invoice images or PDFs for automatic cost entry creation.

## Fields to Extract

### Required Fields
- **Invoice Number**: Unique identifier on the invoice
- **Invoice Date**: Date of the invoice (not due date)
- **Vendor/Supplier Name**: Company issuing the invoice
- **Total Amount**: Grand total including taxes

### Line Items (per item)
- **Description**: What was purchased
- **Quantity**: Number of units (default 1 if not shown)
- **Unit Price**: Price per unit (calculate if only total shown)
- **Line Total**: Quantity × Unit Price

### Optional Fields
- **Due Date**: Payment due date
- **Payment Terms**: NET30, COD, etc.
- **Tax Amount**: SST, GST breakdown
- **Subtotal**: Pre-tax total
- **Discount**: Any discounts applied
- **PO Reference**: Purchase order number if mentioned

## Confidence Scoring

Rate extraction confidence for each field:
- **High**: Clearly visible, unambiguous
- **Medium**: Partially visible or requires interpretation
- **Low**: Inferred or calculated from other fields

Only create cost entries for items with High or Medium confidence.

## Data Mapping

### To Cost Entry
```
Cost.description = Line Item Description
Cost.amount = Line Total
Cost.date = Invoice Date
Cost.supplierId = Match vendor name to existing supplier
```

### To Document Metadata
```
Document.invoiceNumber = Invoice Number
Document.invoiceDate = Invoice Date
Document.vendorName = Vendor Name
Document.totalAmount = Total Amount
```

## Handling Edge Cases

### Multiple Pages
- Process all pages as single invoice
- Combine line items from all pages
- Use total from final page

### Handwritten Invoices
- Extract with Medium confidence max
- Flag for manual review

### Foreign Currency
- Note the currency (don't convert)
- Store currency code with amount

### Partial/Damaged
- Extract what's readable
- Mark affected fields as Low confidence
- Flag for manual review

## Output Format

```json
{
  "invoice": {
    "number": "INV-2024-001",
    "date": "2024-03-15",
    "vendor": "ABC Supplies Sdn Bhd",
    "subtotal": 1000.00,
    "tax": 60.00,
    "total": 1060.00,
    "currency": "MYR",
    "confidence": "high"
  },
  "lineItems": [
    {
      "description": "M8 Stainless Steel Bolts",
      "quantity": 100,
      "unitPrice": 5.00,
      "total": 500.00,
      "confidence": "high"
    }
  ],
  "flags": []
}
```

## Validation Rules

1. Total should equal sum of line items (within rounding)
2. Invoice date should be in the past
3. All amounts should be positive
4. Line totals should equal qty × unit price
