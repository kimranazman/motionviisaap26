# Feature Landscape: CRM & Project Financials

**Domain:** Sales pipeline + project cost tracking for internal team
**Context:** 3-person team, high-ticket deals, repeat clients
**Researched:** 2026-01-22
**Confidence:** HIGH (well-established domain patterns)

## Context

This research addresses CRM and project financials features for:
- Small internal team (3 people: Khairul, Azlan, Izyani)
- High-ticket B2B deals (few but significant)
- Repeat clients with simpler qualification flow
- Three project entry points: pipeline deals, repeat client potentials, direct creation
- Projects can optionally link to strategic initiatives (KRIs)
- Goal: Track pipeline, convert won deals to projects, monitor costs and profit

---

## Table Stakes

Features users expect. Missing = system feels incomplete for CRM/project financials.

### Sales Pipeline

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Visual pipeline (Kanban)** | Standard CRM pattern, intuitive deal tracking | Low | Already have Kanban infra from initiatives |
| **Deal stages (Lead > Won/Lost)** | Fundamental to pipeline management | Low | 5-stage: Lead, Qualified, Proposal, Negotiation, Won/Lost |
| **Deal value tracking** | Core to forecasting, always expected | Low | Currency field on deal (MYR) |
| **Deal title/description** | Know what the deal is about | Low | Text fields |
| **Deal-to-project conversion** | Won deals become work; manual creation wasteful | Medium | Auto-create Project when status = Won |
| **Company tracking** | High-ticket B2B always tracks company | Low | Company entity with name, industry |
| **Client PIC (contact)** | Know who to talk to at each company | Low | Contact linked to company |
| **Basic pipeline metrics** | "How much is in pipeline?" is first question | Low | Total value by stage, deal count |

### Repeat Client Tracking

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Potential projects list** | Repeat clients have simpler flow than new leads | Low | Separate Kanban: Potential > Confirmed/Cancelled |
| **Client history visibility** | See past projects for context on new work | Low | Company detail shows related projects |
| **Potential-to-project conversion** | Same pattern as pipeline, just simpler | Low | Auto-create Project when Potential = Confirmed |
| **Link to company** | Know which client the potential is for | Low | Required foreign key to Company |

### Project Entity

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Three entry points** | Projects come from: pipeline, potential, direct | Medium | Three creation flows, one Project entity |
| **Link to KRI (optional)** | Some projects tie to strategic initiatives | Low | Optional foreign key to Initiative |
| **Standalone projects** | Internal work, Talenta projects have no deal | Low | No pipeline/potential link required |
| **Project status tracking** | Know what stage project is in | Low | Draft, Active, Completed, Cancelled |
| **Revenue from deal** | Carried from won deal value | Low | Auto-populated, editable |
| **Project title/description** | Know what the project is | Low | Text fields |

### Project Costs

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Cost line items** | Break down expenses by item | Low | Description, amount, category, date |
| **Cost categories** | Labor, materials, vendors, misc | Low | Enum: Labor, Materials, Vendors, Travel, Software, Other |
| **Receipt uploads** | Proof of expense for reference | Medium | File upload to local storage |
| **Cost totals** | Sum of all cost items | Low | Computed field |
| **Profit calculation** | Revenue minus costs | Low | Derived: deal value - total costs |

### Dashboard Widgets

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Pipeline by stage** | Visual breakdown of deal stages | Low | Bar chart or stage cards with values |
| **Pipeline total value** | Answer "what's total forecasted?" | Low | Sum of all open deal values |
| **Revenue summary** | What did we earn? | Low | Sum of completed project revenues |
| **Profit summary** | What did we net? | Low | Revenue - costs for completed projects |

### Why These Are Table Stakes

According to industry research:
- Visual pipeline management is "non-negotiable" for sales CRMs ([Superoffice](https://www.superoffice.com/blog/pipeline-management/))
- Deal-to-project conversion is standard in CRMs that combine sales and project management ([eWay-CRM](https://www.eway-crm.com/resources/how-to-use-eway-crm/convert-deals-companies-contacts-projects/))
- Cost tracking with categories and receipt storage is expected for project profitability ([Scoro](https://www.scoro.com/blog/project-cost-tracking/))
- High-ticket B2B sales require company and contact (PIC) tracking ([Salesflare](https://blog.salesflare.com/best-b2b-crm))

---

## Differentiators

Features that would add value but are NOT expected for an internal 3-person tool.

| Feature | Value Proposition | Complexity | Recommendation |
|---------|-------------------|------------|----------------|
| **Weighted pipeline value** | More accurate forecast (probability * value) | Low | **Build** - simple multiplication, high value |
| **Win rate tracking** | Learn from past performance | Low | **Build** - count won / count closed |
| **Deal aging alerts** | Catch stale deals before they go cold | Low | **Build** - reuse notification infra |
| **Deal notes/activity log** | Record conversations and progress | Low | **Build** - simple text log per deal |
| **Expected close date** | Better forecasting by time period | Low | **Build** - date field on deal |
| **Cost vs budget comparison** | "Are we on track?" for each project | Medium | **Defer** - adds budget field, comparison logic |
| **Time tracking on projects** | Know labor cost accurately | High | **Defer** - significant new feature |
| **Invoice generation** | Create invoices from projects | High | **Defer** - use external accounting tool |
| **Multi-currency support** | International deals | Medium | **Defer** - 3-person team, MYR sufficient |
| **Client portal** | External client access | High | **Defer** - internal tool only |
| **Email integration** | Log emails to deals | High | **Defer** - overkill for 3-person team |
| **Sales cycle analytics** | Detailed conversion insights | Medium | **Defer** - nice but not essential |
| **Recurring revenue tracking** | Subscription model | Medium | **Defer** - project-based, not SaaS |

### Why These Are Differentiators (Not Table Stakes)

For a small internal team (3 users):
- **Weighted pipeline** adds forecasting accuracy with minimal effort
- **Win rate** is valuable learning but not blocking functionality
- **Time tracking** is a whole separate system; use external tools if needed
- **Invoice generation** belongs in accounting software (already have external tools)
- **Multi-currency** is unnecessary when all clients pay in MYR

---

## Anti-Features

Features to deliberately NOT build. Common mistakes for small internal teams.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Complex lead scoring** | 3-person team doesn't need automated prioritization; few deals means manual review is fast | Manual qualification through pipeline stages |
| **AI-powered forecasting** | Overkill for few deals; insufficient data for ML to be meaningful | Simple sum of weighted pipeline value |
| **Marketing automation** | Not a marketing tool; focus on deal/project tracking | External tools (Mailchimp) if ever needed |
| **Territory management** | No territories; 3 people share everything | Single shared pipeline |
| **Role-based deal visibility** | Entire team should see all deals for context | Everyone sees everything |
| **Activity tracking/logging every action** | Every click logged is overhead for small team; creates noise | Manual notes on deals/projects when meaningful |
| **Customer support ticketing** | Different domain, different tool | Use email or external ticketing |
| **Advanced reporting builder** | 3 people don't need customizable reports | Fixed, simple dashboard widgets |
| **Approval workflows for deals** | Small team decides together informally | No formal approval chains needed |
| **API for external integrations** | Internal tool only; no external consumers | Build only if specific integration needed |
| **Mobile app** | Web responsive is enough for internal tool | Mobile-responsive design sufficient |
| **Gamification/leaderboards** | 3 people; no need for sales competition mechanics | Skip entirely |
| **Email/SMS notifications** | 3-person team; verbal/Slack is faster | In-app notifications only (existing system) |
| **Duplicate detection AI** | Low deal volume; team knows clients personally | Manual awareness |
| **Custom pipeline stages** | Fixed stages are clearer for small team; prevents confusion | Hardcode the 5 stages |
| **Multi-pipeline support** | One business, one sales pipeline | Single pipeline + separate potential projects Kanban |
| **Contact enrichment** | Auto-populate from LinkedIn/etc is overkill for few clients | Manual entry |
| **Call recording/transcription** | Adds complexity and storage burden | Take notes manually |
| **Quote/proposal generator** | Use external tools (Google Docs) for complex quotes | Link to external quote documents |

### Why Anti-Features Matter

According to CRM implementation research:
- "Over-customization is a major reason CRM projects fail" ([Close.com](https://www.close.com/blog/crm-implementation-mistakes))
- "65% of CRM failures can be attributed to poor user adoption" - often caused by complexity ([Rapitek](https://rapitek.com/en/blog/2025/7/top-7-crm-mistakes-small-teams-make-2025-how-to-avoid/))
- "Creating too many unnecessary fields can cause the system to feel bulky" ([SmallBusinessHQ](https://smallbusinesshq.co/crm-mistakes/))
- Teams using phased, simple approaches achieve 30% higher adoption rates

---

## Feature Dependencies

```
Company
  |
  +---> Contact (client PIC, belongs to company)
  |
  +---> Pipeline Deal
  |        |
  |        +---> (status = Won) ---> Creates Project
  |        +---> (status = Lost) ---> No project
  |
  +---> Potential Project (for repeat clients)
           |
           +---> (status = Confirmed) ---> Creates Project
           +---> (status = Cancelled) ---> No project

Project
  |
  +---> Source: Pipeline Deal | Potential | Direct
  |
  +---> Initiative (optional link to KRI)
  |
  +---> Cost Items[]
           |
           +---> Receipt (file upload, optional)
```

**Key dependency chain:**
1. Company must exist before Deal/Potential/Project
2. Contact links to Company
3. Deal/Potential auto-creates Project on Won/Confirmed
4. Projects can exist without Deal/Potential (direct creation)
5. Cost items belong to Project
6. Initiative link is optional (many projects are standalone)

---

## Data Model Sketch

```
Company
  - id, name, industry, notes
  - createdAt, updatedAt

Contact
  - id, companyId, name, email, phone, role
  - createdAt, updatedAt

PipelineDeal
  - id, companyId, contactId
  - title, description, value
  - stage: Lead | Qualified | Proposal | Negotiation | Won | Lost
  - expectedCloseDate?
  - projectId? (set when converted)
  - createdAt, closedAt, updatedAt

PotentialProject
  - id, companyId, contactId
  - title, description, estimatedValue
  - status: Potential | Confirmed | Cancelled
  - projectId? (set when converted)
  - createdAt, updatedAt

Project
  - id, companyId
  - title, description, revenue
  - status: Draft | Active | Completed | Cancelled
  - sourceType: Pipeline | Potential | Direct
  - pipelineDealId?, potentialProjectId?, initiativeId?
  - createdAt, completedAt, updatedAt

CostItem
  - id, projectId
  - description, amount
  - category: Labor | Materials | Vendors | Travel | Software | Other
  - date, receiptUrl?
  - createdAt, updatedAt
```

---

## Pipeline Stage Definitions

| Stage | Meaning | Entry Criteria | Exit Criteria |
|-------|---------|----------------|---------------|
| **Lead** | Initial contact or inquiry | New opportunity identified | Budget/need confirmed |
| **Qualified** | Confirmed budget, authority, need, timeline | BANT criteria met | Requested proposal |
| **Proposal** | Quote/proposal submitted | Proposal sent to client | Client reviewing/negotiating |
| **Negotiation** | Terms being discussed | Client engaged in back-and-forth | Agreement reached or deal lost |
| **Won** | Deal closed successfully | Contract signed/PO received | Project created |
| **Lost** | Deal did not close | Client declined or went silent | Reason documented |

### Potential Project Stages

| Stage | Meaning |
|-------|---------|
| **Potential** | Repeat client discussed new work; not yet confirmed |
| **Confirmed** | Client confirmed they want to proceed; project created |
| **Cancelled** | Client decided not to proceed |

---

## MVP Recommendation

### Phase 1: Core Entities and Pipeline
- Company entity (name, industry, notes)
- Contact entity linked to company
- Pipeline Deal with 5 stages
- Potential Project for repeat clients (3 stages)
- Kanban views for both pipeline and potentials

### Phase 2: Projects and Conversion
- Project entity with status tracking
- Three entry points: pipeline, potential, direct
- Auto-create project when Deal = Won or Potential = Confirmed
- Optional KRI linking

### Phase 3: Financials and Dashboard
- Cost line items with categories
- Receipt uploads
- Profit calculation (revenue - costs)
- Dashboard widgets (pipeline value, revenue, profit)

### Defer to Post-v1.2
- Weighted pipeline value
- Win rate tracking
- Deal aging alerts
- Budget vs actual comparison

---

## Sources

### CRM Pipeline Management
- [monday.com - Sales Pipeline Stages](https://monday.com/blog/crm-and-sales/sales-pipeline-stages/)
- [Superoffice - Pipeline Management](https://www.superoffice.com/blog/pipeline-management/)
- [Superoffice - Boost Your Sales Pipeline](https://www.superoffice.com/blog/boost-your-sales-pipeline/)
- [Salesforce - Pipeline Management](https://www.salesforce.com/sales/pipeline/management/)

### High-Ticket B2B Sales
- [Folk.app - High Ticket Sales](https://www.folk.app/articles/high-ticket-sales-101-how-to-build-a-personalized-approach-for-significant-deals)
- [Breakcold - CRM in High-Ticket Sales](https://www.breakcold.com/how-to/how-to-use-crm-in-high-ticket-sales)
- [Salesflare - Best B2B CRM](https://blog.salesflare.com/best-b2b-crm)
- [Apollo.io - High Ticket Sales](https://www.apollo.io/insights/what-are-high-ticket-sales)

### Deal-to-Project Conversion
- [eWay-CRM - Convert Deals to Projects](https://www.eway-crm.com/resources/how-to-use-eway-crm/convert-deals-companies-contacts-projects/)
- [Capsule CRM - Pipeline to Project Management](https://capsulecrm.com/blog/after-sales-moving-to-pipeline/)
- [OnePageCRM - Project Management CRM](https://www.onepagecrm.com/blog/project-management-crm/)
- [Zoho - Deal to Project Automation](https://www.blungo.com/blogs/post/Automatically-create-a-Zoho-Project-when-deal-is-won-in-Zoho-CRM)

### Project Cost Tracking
- [monday.com - Project Cost Tracking Guide](https://monday.com/blog/project-management/project-cost-tracking/)
- [monday.com - Cost Breakdown Structure](https://monday.com/blog/project-management/cost-breakdown-structure/)
- [Scoro - Project Cost Tracking](https://www.scoro.com/blog/project-cost-tracking/)
- [Avaza - Project Profitability](https://www.avaza.com/how-to-measure-project-profitability/)
- [Toggl - Project Profitability](https://toggl.com/resources/project-profitability/)

### Repeat Client Management
- [Method - Repeat Customers with CRM](https://www.method.me/blog/repeat-customer/)
- [Kylas - Repeat Customers CRM](https://kylas.io/blog/repeat-customers)
- [HubSpot - Customer Retention Tools](https://blog.hubspot.com/service/customer-retention-tools)

### Revenue Forecasting
- [Forecastio - Sales Forecasting Tools 2026](https://forecastio.ai/blog/sales-forecasting-software)
- [monday.com - Revenue Management Software](https://monday.com/blog/crm-and-sales/revenue-management-software/)
- [Salesmate - CRM Small Business](https://www.salesmate.io/crm-small-business/)

### CRM Mistakes to Avoid
- [Close.com - CRM Implementation Mistakes](https://www.close.com/blog/crm-implementation-mistakes)
- [Rapitek - CRM Mistakes Small Teams 2025](https://rapitek.com/en/blog/2025/7/top-7-crm-mistakes-small-teams-make-2025-how-to-avoid/)
- [SmallBusinessHQ - CRM Mistakes](https://smallbusinesshq.co/crm-mistakes/)
- [Sable CRM - CRM Mistakes](https://www.sablecrm.com/10-crm-mistakes-businesses-should-avoid/)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes | HIGH | Well-established CRM and project management patterns |
| Differentiators | HIGH | Based on complexity vs value analysis for small team |
| Anti-Features | HIGH | Strong consensus in CRM implementation literature |
| Data Model | MEDIUM | Standard patterns; may need adjustment during implementation |
| Pipeline Stages | HIGH | Industry-standard 5-stage pipeline for B2B |
| Cost Categories | MEDIUM | Common categories; may add/adjust based on actual usage |
