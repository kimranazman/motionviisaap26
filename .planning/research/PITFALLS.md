# Pitfalls Research: CRM & Project Financials (v1.2)

**Project:** SAAP 2026 v2
**Context:** Adding sales pipeline and project cost tracking to existing Next.js 14 App Router application
**Researched:** 2026-01-22
**Overall Confidence:** HIGH (verified with industry best practices and technical documentation)

---

## Critical Pitfalls

Mistakes that can cause data corruption, financial inaccuracies, or major rewrites.

### Pitfall 1: Floating Point Currency Calculations

**What goes wrong:** Using JavaScript's native `Number` type for financial calculations leads to precision errors. The classic `0.1 + 0.2 = 0.30000000000000004` problem compounds across multiple operations, causing revenue/profit miscalculations.

**Why it happens:** JavaScript uses IEEE 754 floating-point arithmetic which cannot precisely represent many decimal fractions. Financial calculations involving discounts, taxes, or multiple cost items accumulate these tiny errors into significant discrepancies.

**Consequences:**
- Revenue totals don't match sum of individual deals
- Profit margins show incorrect values
- Receipt totals mismatch with calculated costs
- Audit reports reveal unexplainable discrepancies

**Warning signs:**
- Dashboard totals differ from line-item sums
- "Rounding errors" appearing in financial reports
- Balance calculations that don't reach zero when expected
- Currency values displaying with 10+ decimal places

**Prevention:**
```typescript
// WRONG: Native JavaScript arithmetic
const total = price * quantity; // 19.99 * 3 = 59.96999...

// CORRECT: Store amounts in cents (smallest currency unit)
// In Prisma schema - already using Decimal:
// revenue Decimal @db.Decimal(12, 2)

// In application code, use currency.js or store as integers:
import currency from 'currency.js';

const price = currency(19.99);
const total = price.multiply(3); // Precise: 59.97

// Or use integer cents:
const priceInCents = 1999; // RM19.99
const totalInCents = priceInCents * 3; // 5997 (RM59.97)
const displayTotal = (totalInCents / 100).toFixed(2); // "59.97"
```

**Phase to address:** Phase 1 (Schema & Types) - Establish money handling patterns before any financial data is stored

**Sources:**
- [Currency Calculations in JavaScript - Honeybadger](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/)
- [currency.js Documentation](https://currency.js.org/)
- [How to Handle Monetary Values in JavaScript](https://frontstuff.io/how-to-handle-monetary-values-in-javascript)

---

### Pitfall 2: Missing Audit Trail for Financial Changes

**What goes wrong:** Financial data (deal values, costs, receipts) is modified without tracking who changed what and when. When discrepancies arise, there's no way to investigate or establish accountability.

**Why it happens:** Developers focus on CRUD operations without considering the compliance and debugging value of change history. The existing app doesn't have audit logging, making it easy to overlook.

**Consequences:**
- Cannot investigate financial discrepancies
- No accountability for data changes
- Compliance issues if audited
- Lost business intelligence about deal progression

**Warning signs:**
- Unable to answer "who changed this deal value?"
- No history of cost adjustments
- Disputes about original vs. modified figures
- Manual tracking in external spreadsheets

**Prevention:**
```prisma
// Add audit log for financial entities
model DealHistory {
  id            String   @id @default(cuid())
  dealId        String
  deal          Deal     @relation(fields: [dealId], references: [id])
  field         String   // e.g., "value", "stage"
  oldValue      String?
  newValue      String?
  changedBy     String
  changedByUser User     @relation(fields: [changedBy], references: [id])
  changedAt     DateTime @default(now())
  reason        String?  // Optional: why was this changed?

  @@index([dealId])
  @@index([changedAt])
  @@map("deal_history")
}

// Track changes in update operations
async function updateDealValue(dealId: string, newValue: number, userId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });

  await prisma.$transaction([
    prisma.dealHistory.create({
      data: {
        dealId,
        field: 'value',
        oldValue: deal.value.toString(),
        newValue: newValue.toString(),
        changedBy: userId,
      }
    }),
    prisma.deal.update({
      where: { id: dealId },
      data: { value: newValue }
    })
  ]);
}
```

**Phase to address:** Phase 2 (Deal Tracking) - Build audit trail into deal operations from the start

**Sources:**
- [Audit Trails: Track Changes - Bill.com](https://www.bill.com/learning/audit-trails)
- [Audit Trail Best Practices - Ramp](https://ramp.com/blog/what-are-audit-trails)

---

### Pitfall 3: Pipeline Stage Transitions Without Validation

**What goes wrong:** Deals can be moved to any stage without business logic validation, allowing invalid transitions like Lead -> Won (skipping qualification) or moving backwards after invoicing.

**Why it happens:** Simple CRUD-based stage updates without state machine logic. The UI allows drag-and-drop to any column without checking if the transition is valid.

**Consequences:**
- Unreliable pipeline metrics (deals bypass qualification)
- Revenue forecasting based on unqualified deals
- Projects created from improperly closed deals
- Confusion about deal status and history

**Warning signs:**
- Deals jumping multiple stages at once
- "Won" deals with no proposal/negotiation history
- Inconsistent stage progression patterns
- Arguments about "correct" way to move deals

**Prevention:**
```typescript
// Define valid transitions as a state machine
const VALID_TRANSITIONS: Record<DealStage, DealStage[]> = {
  LEAD: ['QUALIFIED', 'LOST'],           // Can qualify or disqualify
  QUALIFIED: ['PROPOSAL', 'LEAD', 'LOST'], // Can progress, revert, or lose
  PROPOSAL: ['NEGOTIATION', 'QUALIFIED', 'LOST'],
  NEGOTIATION: ['WON', 'PROPOSAL', 'LOST'],
  WON: [],                                // Terminal state - no changes
  LOST: ['LEAD'],                         // Can resurrect to lead only
};

// Validate before updating
function canTransition(from: DealStage, to: DealStage): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// In API route
export async function PATCH(req: Request) {
  const { dealId, newStage } = await req.json();
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });

  if (!canTransition(deal.stage, newStage)) {
    return Response.json(
      { error: `Cannot move from ${deal.stage} to ${newStage}` },
      { status: 400 }
    );
  }

  // Proceed with update...
}
```

**Phase to address:** Phase 2 (Pipeline Implementation) - Implement validation before building UI

**Sources:**
- [State Machines in Practice - DEV](https://dev.to/pragativerma18/state-machines-in-practice-implementing-solutions-for-real-challenges-3l76)
- [Mastering State Machines - Java Tech Blog](https://javanexus.com/blog/mastering-state-machines-avoiding-pitfalls)
- [How to Design State Machines for Microservices - Red Hat](https://developers.redhat.com/articles/2021/11/23/how-design-state-machines-microservices)

---

### Pitfall 4: Deal-to-Project Conversion Data Loss

**What goes wrong:** When a deal is marked "Won" and creates a Project, important context (client contacts, proposal details, negotiation history) is lost or not carried over.

**Why it happens:** Deal and Project are designed as separate entities without proper relationship mapping. The conversion process only copies basic fields like name and value.

**Consequences:**
- Project team lacks deal context
- Client expectations from proposal not visible
- Repeated questions to client about already-discussed items
- No traceability from project costs back to original deal

**Warning signs:**
- Manually copying deal notes to project
- "Who was the client contact again?" questions
- Proposal terms not reflected in project setup
- Cannot find original deal from project view

**Prevention:**
```prisma
// Maintain bidirectional relationship
model Deal {
  id            String       @id @default(cuid())
  // ... other fields
  project       Project?     @relation("DealProject")
  projectId     String?      @unique

  // Store proposal/negotiation details that should carry over
  proposalNotes String?      @db.Text
  agreedTerms   String?      @db.Text
  clientPIC     String?      // Client person in charge
  companyId     String?
  company       Company?     @relation(fields: [companyId], references: [id])
}

model Project {
  id              String   @id @default(cuid())
  // ... other fields
  sourceDealId    String?  @unique
  sourceDeal      Deal?    @relation("DealProject", fields: [sourceDealId], references: [id])

  // Copy essential context at creation, maintain link for history
}

// Conversion function preserves context
async function convertDealToProject(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { company: true }
  });

  return prisma.$transaction([
    prisma.project.create({
      data: {
        name: deal.name,
        revenue: deal.value,
        sourceDealId: deal.id,
        clientName: deal.company?.name,
        clientPIC: deal.clientPIC,
        notes: deal.proposalNotes, // Carry over deal context
      }
    }),
    prisma.deal.update({
      where: { id: dealId },
      data: { stage: 'WON' }
    })
  ]);
}
```

**Phase to address:** Phase 3 (Projects) - Design Project schema with Deal relationship in mind

**Sources:**
- [CRM Workflow Automation - Nutshell](https://www.nutshell.com/blog/crm-automation-examples)
- [When CRMs Go Bad - Secret Source Marketing](https://blog.secretsourcemarketing.com/double-digit/crm-implementing)

---

### Pitfall 5: Receipt Storage in Database BLOB

**What goes wrong:** Storing uploaded receipt images directly in the database as BLOBs, causing database bloat, slow backups, and poor performance.

**Why it happens:** Simplest implementation path - save file bytes to database column. Avoids complexity of external storage setup.

**Consequences:**
- Database size explodes (50KB-5MB per receipt)
- Backups become slow and unreliable
- Database queries slow down
- NAS storage fills up faster than expected
- Cannot use CDN for file delivery

**Warning signs:**
- Database size growing disproportionately
- Slow page loads when viewing costs with receipts
- Backup failures or timeouts
- "File too large" errors

**Prevention:**
```typescript
// Store files on filesystem, store path in database

// Prisma schema - store path only
model CostItem {
  id            String   @id @default(cuid())
  // ... other fields
  receiptPath   String?  // e.g., "/uploads/receipts/2026/01/abc123.pdf"
  receiptName   String?  // Original filename for display
}

// Server action for upload
async function uploadReceipt(formData: FormData, projectId: string) {
  const file = formData.get('receipt') as File;

  // Generate unique path
  const date = new Date();
  const dir = `receipts/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const filename = `${cuid()}_${file.name}`;
  const fullPath = path.join(process.cwd(), 'uploads', dir, filename);

  // Ensure directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  // Return relative path for database storage
  return `/uploads/${dir}/${filename}`;
}

// For internal tool, local filesystem is fine
// For production scale, use S3/Cloudflare R2
```

**Phase to address:** Phase 4 (Cost Tracking) - Set up file storage pattern before implementing receipts

**Sources:**
- [Building File Storage with Next.js and S3](https://www.alexefimenko.com/posts/file-storage-nextjs-postgres-s3)
- [How to Optimize File Management in Next.js](https://www.telerik.com/blogs/how-optimize-file-management-next-js)

---

## Moderate Pitfalls

Mistakes that cause delays, rework, or suboptimal user experience.

### Pitfall 6: Over-Complicated Pipeline Stages

**What goes wrong:** Defining too many pipeline stages (8+) trying to capture every possible deal state, leading to confusion and inconsistent usage.

**Why it happens:** Attempting to map every business scenario into pipeline stages. "What if the client requested a revised proposal?" becomes its own stage.

**Consequences:**
- Users skip stages or use them inconsistently
- Pipeline view becomes cluttered
- Forecasting loses accuracy (too many intermediate states)
- Disagreements about which stage applies

**Warning signs:**
- Stages with few or no deals
- Users asking "which stage should I use?"
- Same deal bouncing between similar stages
- Stages named "Proposal Sent" vs "Proposal Received" vs "Proposal Reviewed"

**Prevention:**
```typescript
// Keep it simple: 5-6 stages maximum
enum DealStage {
  LEAD = 'LEAD',                // Initial contact
  QUALIFIED = 'QUALIFIED',       // Budget/authority/need/timing confirmed
  PROPOSAL = 'PROPOSAL',         // Proposal sent
  NEGOTIATION = 'NEGOTIATION',   // Active negotiation
  WON = 'WON',                   // Deal closed successfully
  LOST = 'LOST',                 // Deal lost
}

// Use tags or custom fields for nuance, not stages
model Deal {
  id            String     @id @default(cuid())
  stage         DealStage
  // Use tags for sub-states
  tags          String?    // e.g., "revised-proposal,pending-approval"
  // Use notes for context
  notes         String?    @db.Text
}
```

For your context (high-ticket, low-volume deals): 5 stages (Lead -> Qualified -> Proposal -> Negotiation -> Won/Lost) is sufficient.

**Phase to address:** Phase 1 (Schema Design) - Define stages once and stick to them

**Sources:**
- [The 9 CRM Stages That Separate Pros from Amateurs - Sparkle](https://sparkle.io/blog/crm-stages/)
- [Sales Pipeline Stages - Pipedrive](https://www.pipedrive.com/en/blog/sales-pipeline-fundamental-stages)
- [A Sales Pipeline Guide - Pipeline CRM](https://pipelinecrm.com/blog/a-sales-pipeline-guide/)

---

### Pitfall 7: Ignoring Indirect/Overhead Costs

**What goes wrong:** Project cost tracking only captures direct expenses (materials, subcontractors), missing indirect costs that consume 20-30% of actual project spend.

**Why it happens:** Direct costs are obvious and have receipts. Indirect costs (staff time, office overhead, equipment depreciation) are harder to allocate.

**Consequences:**
- Projects appear more profitable than reality
- Pricing future work incorrectly
- "Profitable" projects actually lose money
- Surprised by actual margins at year end

**Warning signs:**
- Projects always seem profitable but company isn't
- No mechanism to track internal labor
- Overhead costs not attributed anywhere
- Wide gap between project profits and company profits

**Prevention:**
```prisma
// Include labor/overhead in cost categories
enum CostCategory {
  LABOR_INTERNAL    // Staff time (even if not "billed")
  LABOR_EXTERNAL    // Contractors/freelancers
  MATERIALS         // Physical goods
  VENDORS           // Third-party services
  TRAVEL            // Transportation, accommodation
  OVERHEAD          // Allocated portion of rent/utilities
  OTHER
}

model CostItem {
  id            String       @id @default(cuid())
  projectId     String
  project       Project      @relation(fields: [projectId], references: [id])
  category      CostCategory
  description   String
  amount        Decimal      @db.Decimal(12, 2)
  date          DateTime
  // For labor tracking
  hours         Decimal?     @db.Decimal(6, 2)
  hourlyRate    Decimal?     @db.Decimal(8, 2)  // Internal cost rate
  // For receipts (materials, vendors, travel)
  receiptPath   String?

  @@index([projectId])
  @@index([category])
  @@map("cost_items")
}
```

For a 3-person team, even simple time allocation helps: "Khairul spent ~20 hours on this project at RM100/hr internal rate = RM2,000 labor cost."

**Phase to address:** Phase 4 (Cost Tracking) - Include labor category in cost schema

**Sources:**
- [Project Cost Tracking Guide - Monday.com](https://monday.com/blog/project-management/project-cost-tracking/)
- [Project Budget Tracking - Mastt](https://www.mastt.com/blogs/project-budget-tracking)
- [How to Track Project Costs - Hubstaff](https://hubstaff.com/blog/how-to-track-project-costs-expenses/)

---

### Pitfall 8: Revenue Forecasting Without Probability Weighting

**What goes wrong:** Forecasting revenue by simply summing all pipeline deal values, regardless of stage or likelihood to close.

**Why it happens:** Simple calculation: "We have 5 deals worth RM100K each = RM500K forecast." Ignores that early-stage deals rarely close at initial value.

**Consequences:**
- Wildly optimistic revenue forecasts
- Poor business planning decisions
- Disappointment when actual revenue falls short
- Loss of trust in pipeline data

**Warning signs:**
- Forecast never matches actual results
- Early-stage deals dominating forecast
- No difference between "possible" and "probable" revenue
- Team stops trusting dashboard numbers

**Prevention:**
```typescript
// Assign probability to each stage
const STAGE_PROBABILITY: Record<DealStage, number> = {
  LEAD: 0.10,        // 10% - most leads don't convert
  QUALIFIED: 0.25,   // 25% - qualified but early
  PROPOSAL: 0.50,    // 50% - active opportunity
  NEGOTIATION: 0.75, // 75% - likely to close
  WON: 1.00,         // 100% - closed
  LOST: 0.00,        // 0% - lost
};

// Calculate weighted forecast
async function calculatePipelineForecast() {
  const deals = await prisma.deal.findMany({
    where: { stage: { notIn: ['WON', 'LOST'] } }
  });

  const forecast = deals.reduce((sum, deal) => {
    const probability = STAGE_PROBABILITY[deal.stage];
    return sum + (Number(deal.value) * probability);
  }, 0);

  return {
    pipeline: deals.reduce((s, d) => s + Number(d.value), 0), // Total pipeline
    weighted: forecast,  // Probability-weighted forecast
  };
}

// Dashboard shows both:
// Total Pipeline: RM500,000
// Weighted Forecast: RM187,500
```

**Phase to address:** Phase 5 (Dashboard) - Implement weighted forecasting in dashboard widgets

**Sources:**
- [Revenue Forecasting Tools - Irvine Bookkeeping](https://www.irvinebookkeeping.com/post/top-revenue-forecasting-tools-for-small-businesses)
- [Sales Forecasting Software Guide - Forecastio](https://forecastio.ai/blog/sales-forecasting-software)

---

### Pitfall 9: Separate Pipelines for New vs. Repeat Clients Confusion

**What goes wrong:** Having two separate pipeline types (Sales Pipeline for new leads, Potential Pipeline for repeat clients) but unclear criteria for which to use, leading to inconsistent data.

**Why it happens:** Business logic distinction (new client acquisition vs. existing client upsell) translated directly to separate database entities without clear rules.

**Consequences:**
- Deals miscategorized
- Duplicate records (same opportunity in both)
- Inconsistent reporting (repeat client revenue not counted in "sales")
- Users confused about where to log opportunities

**Warning signs:**
- "Should I put this in Pipeline or Potential?"
- Same client appearing in both systems
- Arguments about total pipeline value
- Different metrics for same business outcome

**Prevention:**
```prisma
// Single Deal entity with source indicator
enum DealSource {
  NEW_LEAD          // New client - came through marketing/outreach
  REPEAT_CLIENT     // Existing client - repeat business
  REFERRAL          // Referred by existing client
  INTERNAL          // Internal/Talenta work
}

model Deal {
  id            String      @id @default(cuid())
  source        DealSource
  companyId     String?
  company       Company?    @relation(fields: [companyId], references: [id])
  // ... same stages, same fields

  // Company relationship tells you if new vs. repeat
  // - No company = new lead (company TBD)
  // - Company with past projects = repeat
}

// Query by source for separate views if needed
const newDeals = await prisma.deal.findMany({
  where: { source: 'NEW_LEAD' }
});

const repeatDeals = await prisma.deal.findMany({
  where: { source: 'REPEAT_CLIENT' }
});
```

**Phase to address:** Phase 1 (Schema Design) - Unify pipeline concept with source attribute

**Sources:**
- [Understanding Pipelines and Deals - ActiveCampaign](https://help.activecampaign.com/hc/en-us/articles/206797510-Understanding-pipelines-stages-deals-and-tasks)
- [Set Up and Manage Pipelines - HubSpot](https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines)

---

### Pitfall 10: Not Planning for Project Entry Points

**What goes wrong:** Projects can only be created from won deals, but the requirement includes three entry points: (1) from deals, (2) linked to KRIs, (3) standalone. Schema designed for only one path.

**Why it happens:** Initial implementation focuses on deal-to-project flow, treating other entry points as afterthoughts.

**Consequences:**
- Internal work (Talenta projects) can't be tracked
- KRI-linked projects awkwardly shoehorned into deal flow
- Database schema requires hacks to support multiple sources
- Reporting doesn't distinguish project origins

**Warning signs:**
- "Fake" deals created just to make projects
- Missing link between KRIs and their projects
- Internal work not visible in project list
- Confusion about project provenance

**Prevention:**
```prisma
enum ProjectSource {
  DEAL              // From won deal (external client)
  KRI               // Linked to Key Result Initiative
  STANDALONE        // Direct creation (internal work)
}

model Project {
  id              String         @id @default(cuid())
  name            String
  source          ProjectSource

  // Optional links based on source
  sourceDealId    String?        @unique
  sourceDeal      Deal?          @relation(fields: [sourceDealId], references: [id])

  sourceKRIId     String?
  sourceKRI       Initiative?    @relation(fields: [sourceKRIId], references: [id])

  // Client info (may come from deal or be entered directly)
  clientName      String?
  clientCompanyId String?
  clientCompany   Company?       @relation(fields: [clientCompanyId], references: [id])

  // Financials
  revenue         Decimal?       @db.Decimal(12, 2)
  costs           CostItem[]

  @@index([source])
  @@map("projects")
}
```

**Phase to address:** Phase 1 (Schema Design) - Design for all three entry points upfront

---

## Minor Pitfalls

Mistakes that cause annoyance or minor inefficiency.

### Pitfall 11: Dashboard Showing Stale Pipeline Data

**What goes wrong:** Dashboard widgets query data on every page load, causing slow rendering and inconsistent numbers if data changes mid-session.

**Why it happens:** Simple implementation fetches fresh data each time. Works initially but becomes noticeable as data grows.

**Consequences:**
- Slow dashboard loads
- Numbers changing unexpectedly
- Multiple database queries for same data
- Poor perceived performance

**Prevention:**
```typescript
// Use React Query or SWR for caching and revalidation
import { useQuery } from '@tanstack/react-query';

function usePipelineStats() {
  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: () => fetch('/api/dashboard/pipeline').then(r => r.json()),
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    refetchOnWindowFocus: true, // Refresh when user returns
  });
}

// Or use Next.js unstable_cache for server-side
import { unstable_cache } from 'next/cache';

const getPipelineStats = unstable_cache(
  async () => {
    // Expensive query here
  },
  ['pipeline-stats'],
  { revalidate: 60 } // Cache for 60 seconds
);
```

**Phase to address:** Phase 5 (Dashboard) - Implement caching when building widgets

---

### Pitfall 12: Lost Deal Reasons Not Tracked

**What goes wrong:** When deals are marked "Lost," no reason is captured. Impossible to analyze why deals fail.

**Why it happens:** Focus on successful path (Lead -> Won). Lost deals treated as simple deletions.

**Consequences:**
- No learning from lost opportunities
- Cannot identify patterns in losses
- Sales process can't improve
- "Why did we lose that deal?" has no answer

**Prevention:**
```prisma
enum LostReason {
  PRICE             // Too expensive
  TIMING            // Bad timing / budget cycle
  COMPETITOR        // Went with competitor
  NO_BUDGET         // No budget available
  NO_DECISION       // Client didn't decide
  SCOPE_MISMATCH    // Our offering didn't fit
  OTHER
}

model Deal {
  id            String       @id @default(cuid())
  // ... other fields
  lostReason    LostReason?
  lostNotes     String?      @db.Text
  lostAt        DateTime?
}

// Require reason when closing as lost
async function closeDealAsLost(
  dealId: string,
  reason: LostReason,
  notes?: string
) {
  return prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: 'LOST',
      lostReason: reason,
      lostNotes: notes,
      lostAt: new Date(),
    }
  });
}
```

**Phase to address:** Phase 2 (Pipeline) - Include lost reason in stage transition UI

---

### Pitfall 13: No Date Tracking for Stage Changes

**What goes wrong:** Only current stage is stored, not when the deal entered each stage. Cannot calculate time-in-stage or sales velocity.

**Why it happens:** Simple implementation only stores current state. Historical progression requires additional tracking.

**Consequences:**
- Cannot measure sales cycle length
- No visibility into bottlenecks
- Unable to identify stuck deals
- "How long has this been in Proposal?" requires guessing

**Prevention:**
```prisma
// Track stage history
model DealStageHistory {
  id            String     @id @default(cuid())
  dealId        String
  deal          Deal       @relation(fields: [dealId], references: [id])
  stage         DealStage
  enteredAt     DateTime   @default(now())
  exitedAt      DateTime?

  @@index([dealId])
  @@map("deal_stage_history")
}

// Helper to get time in current stage
async function getTimeInStage(dealId: string) {
  const current = await prisma.dealStageHistory.findFirst({
    where: { dealId, exitedAt: null },
    orderBy: { enteredAt: 'desc' }
  });

  if (!current) return null;

  const daysInStage = Math.floor(
    (Date.now() - current.enteredAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysInStage;
}
```

**Phase to address:** Phase 2 (Pipeline) - Build stage history tracking into transitions

---

### Pitfall 14: Cost Categories Too Rigid or Too Loose

**What goes wrong:** Either too few categories (everything is "Other") or too many (analysis paralysis when entering costs).

**Consequences:**
- Cost breakdown reports are meaningless
- Users skip categorization
- Can't identify where money goes
- Financial analysis becomes guesswork

**Prevention:**
```typescript
// Start with 5-7 categories that match your business
enum CostCategory {
  LABOR         // Internal and external labor
  MATERIALS     // Physical goods, supplies
  VENDORS       // Third-party services (venues, catering, AV)
  TRAVEL        // Transportation, accommodation, meals
  MARKETING     // Promotional materials, advertising
  OTHER         // Catch-all (monitor and split if grows)
}

// Allow custom subcategories via tags if needed
model CostItem {
  category    CostCategory
  subcategory String?       // Free-form for flexibility
  // e.g., category: VENDORS, subcategory: "Venue Rental"
}

// Review "Other" periodically - if >20%, add new category
```

For event/training business: Labor, Vendors, Materials, Travel, Marketing, Other covers most cases.

**Phase to address:** Phase 4 (Cost Tracking) - Define categories based on actual business expenses

---

## Phase-Specific Warnings Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Schema Design | Floating point money | Use Decimal, establish currency.js patterns |
| Phase 1 | Schema Design | Multiple project sources | Design for all 3 entry points upfront |
| Phase 1 | Schema Design | Pipeline confusion | Single Deal entity with source field |
| Phase 2 | Pipeline | Invalid stage transitions | Implement state machine validation |
| Phase 2 | Pipeline | No stage history | Track stage changes with timestamps |
| Phase 2 | Pipeline | Lost deals not analyzed | Require lost reason on close |
| Phase 3 | Projects | Deal context lost | Maintain bidirectional Deal-Project link |
| Phase 3 | Projects | No audit trail | Log all financial changes |
| Phase 4 | Costs | Database bloat | Store receipt files on filesystem |
| Phase 4 | Costs | Missing indirect costs | Include labor/overhead category |
| Phase 4 | Costs | Bad categories | Start with 5-7 business-aligned categories |
| Phase 5 | Dashboard | Stale data | Implement caching/revalidation |
| Phase 5 | Dashboard | Unrealistic forecast | Use probability-weighted calculations |

---

## Security Checklist for Financial Features

Before deploying v1.2:

- [ ] All financial API routes verify user authentication
- [ ] Only Editors/Admins can create/edit deals and costs
- [ ] Only Admins can delete financial records
- [ ] Receipt uploads validated (file type, size limits)
- [ ] Receipt files stored outside web root or with access control
- [ ] Deal value changes logged with user attribution
- [ ] Cost modifications tracked in audit log
- [ ] Dashboard queries protected against SQL injection (Prisma handles this)
- [ ] File paths sanitized to prevent directory traversal

---

## Checklist Before Implementation

Pre-implementation verification:

- [ ] Money handling approach decided (integer cents or Decimal + currency.js)
- [ ] Pipeline stages defined and validated with team
- [ ] All three project entry points designed in schema
- [ ] Audit trail tables included in migration
- [ ] Receipt storage location planned (filesystem path)
- [ ] Cost categories reviewed with business requirements
- [ ] Dashboard caching strategy chosen
- [ ] Stage transition validation rules documented

---

## Sources

### Financial Calculations
- [Currency Calculations in JavaScript - Honeybadger](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/)
- [How to Handle Monetary Values in JavaScript - Frontstuff](https://frontstuff.io/how-to-handle-monetary-values-in-javascript)
- [currency.js Documentation](https://currency.js.org/)

### CRM & Pipeline Design
- [CRM Implementation Mistakes - Hyegro](https://www.hyegro.com/blog/crm-implementation-mistakes)
- [CRM Challenges - Salesflare](https://blog.salesflare.com/crm-challenges)
- [Sales Pipeline Guide - Pipeline CRM](https://pipelinecrm.com/blog/a-sales-pipeline-guide/)
- [CRM Stages Guide - Sparkle](https://sparkle.io/blog/crm-stages/)
- [Pipeline Stages - Pipedrive](https://www.pipedrive.com/en/blog/sales-pipeline-fundamental-stages)

### Project Cost Tracking
- [Project Cost Tracking Guide - Monday.com](https://monday.com/blog/project-management/project-cost-tracking/)
- [Project Budget Tracking - Mastt](https://www.mastt.com/blogs/project-budget-tracking)
- [How to Track Project Costs - Hubstaff](https://hubstaff.com/blog/how-to-track-project-costs-expenses/)

### State Machine Design
- [State Machines in Practice - DEV](https://dev.to/pragativerma18/state-machines-in-practice-implementing-solutions-for-real-challenges-3l76)
- [Mastering State Machines - Java Tech Blog](https://javanexus.com/blog/mastering-state-machines-avoiding-pitfalls)
- [State Machines for Microservices - Red Hat](https://developers.redhat.com/articles/2021/11/23/how-design-state-machines-microservices)

### Audit Trails
- [Audit Trails Guide - Bill.com](https://www.bill.com/learning/audit-trails)
- [Audit Trail Best Practices - Ramp](https://ramp.com/blog/what-are-audit-trails)
- [Audit Trail Definition - AccountingTools](https://www.accountingtools.com/articles/audit-trail)

### File Storage
- [File Storage with Next.js and S3](https://www.alexefimenko.com/posts/file-storage-nextjs-postgres-s3)
- [File Management in Next.js - Telerik](https://www.telerik.com/blogs/how-optimize-file-management-next-js)

### Revenue Forecasting
- [Sales Forecasting Software - Forecastio](https://forecastio.ai/blog/sales-forecasting-software)
- [Revenue Forecasting Tools - Irvine Bookkeeping](https://www.irvinebookkeeping.com/post/top-revenue-forecasting-tools-for-small-businesses)
