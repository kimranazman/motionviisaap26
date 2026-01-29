# Research: Phase 81 - Pending Count API Enhancement

## Current State

The existing `/api/ai/pending` endpoint returns:
- `totalPending`: Count of documents with aiStatus=PENDING
- `projects`: Array of project summaries with pending counts
- `claudeCommand`: Ready-to-run command string

Current response structure:
```typescript
{
  totalPending: number
  projects: ProjectPendingSummary[]
  claudeCommand: string
}
```

## Required Changes

The API needs to return granular counts for badge display:

```typescript
{
  costs: number,        // Costs with supplierId but no normalizedItem
  invoices: number,     // Documents with category=INVOICE, aiStatus=PENDING
  receipts: number,     // Documents with category=RECEIPT, aiStatus=PENDING
  deliverables: number, // Projects with invoices but no aiExtracted deliverables
  total: number         // Sum of all above
}
```

## Database Queries Needed

### 1. Costs Count
```prisma
prisma.cost.count({
  where: {
    supplierId: { not: null },
    normalizedItem: null
  }
})
```

### 2. Invoices Count
```prisma
prisma.document.count({
  where: {
    category: 'INVOICE',
    aiStatus: 'PENDING'
  }
})
```

### 3. Receipts Count
```prisma
prisma.document.count({
  where: {
    category: 'RECEIPT',
    aiStatus: 'PENDING'
  }
})
```

### 4. Deliverables Count
This is more complex - need to find projects that have invoices (documents with INVOICE category) but no aiExtracted deliverables.

```prisma
// Projects with invoices but no aiExtracted deliverables
prisma.project.count({
  where: {
    documents: {
      some: {
        category: 'INVOICE'
      }
    },
    deliverables: {
      none: {
        aiExtracted: true
      }
    }
  }
})
```

## Implementation Notes

1. **Keep backward compatibility**: The existing response includes `projects` and `claudeCommand` which may be used elsewhere. The new fields should be added alongside existing ones.

2. **Run queries in parallel**: Use `Promise.all()` for all four count queries to minimize response time.

3. **Total calculation**: `total = costs + invoices + receipts + deliverables`

4. **No auth change needed**: Current endpoint already uses `requireAuth()`.

## Files to Modify

- `src/app/api/ai/pending/route.ts` - Enhance GET handler

## Testing

Manual test via curl:
```bash
curl -H "Cookie: authjs.session-token=..." http://localhost:3000/api/ai/pending
```

Expected response shape:
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
