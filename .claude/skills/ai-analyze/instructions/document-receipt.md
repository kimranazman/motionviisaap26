# Receipt Document Extraction Instructions

## Purpose

Extract structured data from receipt images for automatic expense tracking and cost entry creation.

## Fields to Extract

### Required Fields
- **Merchant Name**: Store or vendor name
- **Date**: Transaction date
- **Total Amount**: Final amount paid

### Line Items (per item)
- **Description**: Item purchased
- **Quantity**: Number of items (if discernible from receipt)
- **Unit Price**: Price per unit (if discernible from receipt)
- **Amount**: Total price for the line item

### Optional Fields
- **Receipt Number**: Transaction/receipt ID
- **Payment Method**: Cash, Card, E-wallet
- **Card Last 4**: If card payment
- **Tax Breakdown**: SST shown separately
- **Change Given**: For cash transactions

## Receipt Types

### 1. Retail Receipts (thermal paper)
- Usually short item names
- May have product codes
- Often include store location

### 2. Hardware Store Receipts
- Detailed item descriptions
- Unit counts and prices
- May span multiple pages

### 3. Restaurant/F&B Receipts
- Item names may be abbreviated
- Service charges, tips
- Table/order numbers

### 4. Online/E-commerce Receipts
- Order numbers prominent
- Shipping addresses (ignore for privacy)
- May include tracking info

## Confidence Scoring

- **High**: Machine-printed, clearly legible
- **Medium**: Some blur but readable
- **Low**: Significant degradation, partial text

## Data Mapping

### To Cost Entry
```
Cost.description = Summarized items or "Purchase from [Merchant]"
Cost.amount = Total Amount (canonical total)
Cost.quantity = Quantity (if available per line item)
Cost.unitPrice = Unit Price (if available per line item)
Cost.date = Receipt Date
Cost.supplierId = Match merchant to existing supplier (if any)
```

## Aggregation Rules

### Single Category
If all items are similar, create one cost entry:
- "Hardware supplies from ABC Hardware"
- "Office supplies from Stationery Store"

### Mixed Categories
If items span multiple cost categories:
- Create separate entries per category
- Or single entry with "Mixed purchase from [Merchant]"

## Handling Edge Cases

### Faded Receipts
- Thermal paper fades - extract what's visible
- Mark with Low confidence
- Flag for manual review

### Foreign Language
- Extract numbers accurately
- Transliterate merchant name
- Note original language in flags

### Refunds/Returns
- Check for negative amounts
- Flag refund transactions
- Don't auto-create cost entries for refunds

### Multiple Payments
- Note split payment methods
- Use total final amount

## Output Format

```json
{
  "receipt": {
    "merchantName": "MR DIY",
    "receiptNumber": "RC-123456",
    "date": "2024-03-15",
    "total": 45.60,
    "paymentMethod": "card",
    "currency": "MYR",
    "confidence": "high"
  },
  "lineItems": [
    {
      "description": "Cable Tie 100pcs",
      "quantity": 1,
      "unitPrice": 8.90,
      "amount": 8.90,
      "confidence": "high"
    },
    {
      "description": "Electrical Tape",
      "quantity": 2,
      "unitPrice": 2.95,
      "amount": 5.90,
      "confidence": "high"
    }
  ],
  "suggestedEntry": {
    "description": "Hardware supplies from MR DIY",
    "amount": 45.60,
    "category": "Materials"
  },
  "flags": []
}
```

## Validation Rules

1. Total should approximately match sum of items
2. Date should be today or in the past
3. All amounts should be positive (except refunds)
4. Merchant name should be non-empty
