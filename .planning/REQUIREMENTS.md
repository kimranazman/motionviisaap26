# Requirements: SAAP2026v2

**Defined:** 2026-01-25
**Core Value:** Users can compare supplier prices for the same item by filtering a table - AI categorizes items, users do the comparison.

## v1.4.1 Requirements

Requirements for v1.4.1 Line Item Categorization & Price Table.

**Context:** v1.4 built on-demand semantic search for price comparison. The actual need was simpler: AI categorizes line items into normalized product names, then users filter a table to compare prices manually. This patch corrects that.

### Line Item Categorization

- [x] **ITEM-01**: Cost entry has `normalizedItem` field (AI-assigned category)
- [x] **ITEM-02**: AI assigns normalizedItem when cost is created
- [x] **ITEM-03**: AI updates normalizedItem when cost description changes
- [x] **ITEM-04**: User can manually edit normalizedItem if AI got it wrong

### Supplier Items Table

- [x] **ITEM-05**: User can view table of all line items across all suppliers
- [x] **ITEM-06**: Table shows: item description, normalizedItem, supplier, unit price, project
- [x] **ITEM-07**: User can filter table by normalizedItem (category)
- [x] **ITEM-08**: User can filter table by supplier
- [x] **ITEM-09**: User can sort table by price to compare

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| AI semantic search | v1.4 built this; not needed - table filtering is sufficient |
| PriceComparisonSheet | Remove or deprecate - replaced by table filtering |
| Separate SupplierItem model | Reuse existing Cost model with supplier link |
| Price history tracking | Defer to v2 (SUPP-12) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ITEM-01 | 36 | Complete |
| ITEM-02 | 36 | Complete |
| ITEM-03 | 36 | Complete |
| ITEM-04 | 36 | Complete |
| ITEM-05 | 36 | Complete |
| ITEM-06 | 36 | Complete |
| ITEM-07 | 36 | Complete |
| ITEM-08 | 36 | Complete |
| ITEM-09 | 36 | Complete |

**Coverage:**
- v1.4.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-01-25*
*Corrects: v1.4 price comparison implementation gap*
