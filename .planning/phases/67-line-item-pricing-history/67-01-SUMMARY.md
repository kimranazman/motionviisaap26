# Summary: 67-01 Schema + Cost CRUD + AI Import for Quantity/Unit Price

## Status: COMPLETE

## What was built
- Added optional `quantity` (Decimal 10,2) and `unitPrice` (Decimal 12,2) fields to Cost model
- Updated POST and GET cost APIs to accept/return quantity and unitPrice
- Updated PATCH cost API to accept quantity and unitPrice updates
- Enhanced CostForm with Quantity and Unit Price fields with auto-calculation (qty x unitPrice = amount)
- Updated CostCard to display qty x unitPrice breakdown when present
- Updated ReceiptItem type, receipt import API, and auto-import utility to support quantity/unitPrice
- Updated receipt extraction instructions with quantity/unitPrice fields and output format

## Commits
| Hash | Description |
|------|-------------|
| da5fcd3 | feat(67-01): add quantity and unitPrice fields to Cost model |
| 0ae3750 | feat(67-01): accept quantity/unitPrice in cost create and list APIs |
| 300fd01 | feat(67-01): accept quantity/unitPrice in cost update API |
| ac1e136 | feat(67-01): add quantity and unit price fields to CostForm |
| cd83bd6 | feat(67-01): display quantity x unit price breakdown in CostCard |
| 924ae4b | feat(67-01): add quantity/unitPrice to AI receipt extraction and import |
| 653345c | docs(67-01): update receipt extraction instructions with quantity/unitPrice |
| 38c92ad | fix(67-01): remove unused Badge import in contact-list |

## Deviations
- Used `prisma db push` instead of `prisma migrate dev` due to shadow database permission issue (MySQL user lacks CREATE DATABASE permission). Schema is in sync.
- Fixed pre-existing lint error (unused Badge import in contact-list.tsx) that was blocking build.

## Verification
- [x] Schema has quantity and unitPrice fields
- [x] POST API accepts and persists quantity/unitPrice
- [x] PATCH API accepts and persists quantity/unitPrice
- [x] GET API serializes quantity/unitPrice Decimals to Numbers
- [x] CostForm shows Quantity and Unit Price fields with auto-calc
- [x] CostCard displays qty x unitPrice breakdown
- [x] AI receipt import persists quantity/unitPrice
- [x] Existing costs without quantity/unitPrice work unchanged
- [x] `npx next build` passes
