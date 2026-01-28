# Summary: 67-02 Pricing History Views (By-Item + By-Client)

## Status: COMPLETE

## What was built
- Created `/api/pricing-history` endpoint with `by-item` and `by-client` view modes
- Created PricingTabs component with three tabs: All Items, By Item, By Client
- Created PricingHistoryByItem component with item dropdown filter, min/max/avg stats, and detailed table
- Created PricingHistoryByClient component with company dropdown filter, total spend stats, and detailed table
- Updated supplier-items page to use tabbed layout, renamed to "Pricing History"
- Added Qty and Unit Price columns to existing supplier items table
- Renamed sidebar nav item from "Price Comparison" to "Pricing History"

## Commits
| Hash | Description |
|------|-------------|
| b6af00b | feat(67-02): create pricing history API with by-item and by-client views |
| 71fa86b | feat(67-02): create PricingTabs component for three-view navigation |
| 43a2b3d | feat(67-02): create By-Item pricing history component |
| be51236 | feat(67-02): create By-Client pricing history component |
| beecef2 | feat(67-02): integrate pricing tabs into supplier-items page |
| 12b361d | feat(67-02): add qty and unit price columns to supplier items table |
| 50af31d | refactor(67-02): rename sidebar nav item from Price Comparison to Pricing History |

## Deviations
- Added sidebar nav rename (Price Comparison -> Pricing History) for consistency with page title change. Not in original plan but necessary for coherence.

## Verification
- [x] `/supplier-items` page shows three tabs: All Items, By Item, By Client
- [x] "All Items" tab shows existing supplier items table with new Qty and Unit Price columns
- [x] "By Item" tab has normalized item dropdown and pricing history table with stats
- [x] "By Client" tab has company dropdown and client costs table with stats
- [x] API `/api/pricing-history?view=by-item` returns costs with quantity/unitPrice
- [x] API `/api/pricing-history?view=by-client` returns costs grouped by company
- [x] Empty states show appropriate messages
- [x] `npx next build` passes
