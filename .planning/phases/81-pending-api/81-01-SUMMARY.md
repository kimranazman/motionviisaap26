# Summary: 81-01 Enhance Pending API with Granular Counts

## Status: Complete

## What Was Built

Extended `/api/ai/pending` endpoint to return granular counts by type for the UI badge dropdown:

- `costs`: Count of costs with supplierId but no normalizedItem
- `invoices`: Count of documents with category=INVOICE and aiStatus=PENDING
- `receipts`: Count of documents with category=RECEIPT and aiStatus=PENDING
- `deliverables`: Count of projects with invoices but no aiExtracted deliverables
- `total`: Sum of all above counts

All counts are queried in parallel using `Promise.all()` for performance.

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/ai/pending/route.ts` | Added granular count queries and response fields |

## Commits

| Hash | Message |
|------|---------|
| 98e2ddd | feat(81-01): add granular counts to pending API |

## Verification

- [x] TypeScript compiles without errors
- [x] API returns costs count
- [x] API returns invoices count
- [x] API returns receipts count
- [x] API returns deliverables count
- [x] API returns total as sum of all counts
- [x] Existing fields (totalPending, projects, claudeCommand) still present

## Issues

None.

## API Response Example

```json
{
  "costs": 5,
  "invoices": 3,
  "receipts": 2,
  "deliverables": 1,
  "total": 11,
  "totalPending": 5,
  "projects": [...],
  "claudeCommand": "..."
}
```
