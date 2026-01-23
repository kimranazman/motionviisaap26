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

---
---

# Feature Landscape: Document Management & Dashboard Customization

**Domain:** Document uploads + customizable dashboards for internal team
**Context:** SAAP v1.3 milestone features
**Researched:** 2026-01-23
**Confidence:** HIGH (based on industry patterns + web research)

## Context

This research addresses v1.3 milestone features:
- Document management: receipts/invoices attached to projects
- Customizable dashboards: per-user layouts with role-based restrictions
- Existing infrastructure: Projects with cost tracking, fixed dashboard with KPI cards

---

## Document Management

### Table Stakes

Must-have features users expect for document uploads attached to projects.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Drag-and-drop upload** | Standard UX pattern; users expect to drag files from desktop | Medium | Use react-dropzone or similar; visual drop zone with dashed border |
| **Click to upload fallback** | Accessibility requirement; not everyone can drag-drop | Low | Standard file input with styled button |
| **File type validation** | Prevent errors; only accept relevant document types | Low | Allow PDF, PNG, JPG, JPEG; reject executables |
| **File size limit** | Prevent storage abuse; protect server resources | Low | Suggest 10MB limit for receipts/invoices |
| **Upload progress indicator** | User feedback during upload; prevents duplicate uploads | Medium | Progress bar or percentage indicator |
| **File preview/thumbnail** | Quick visual confirmation of uploaded file | Medium | Image thumbnails for images; PDF icon for PDFs |
| **Download original file** | Users need to retrieve uploaded documents | Low | Direct download link |
| **Delete document** | Remove incorrect uploads | Low | With confirmation dialog |
| **Document list per project** | See all documents for a project in one place | Low | Table or card layout |
| **File metadata display** | Show filename, size, upload date, uploader | Low | Essential for audit trail |
| **Document type categorization** | Distinguish receipts from invoices | Low | Simple enum: RECEIPT, INVOICE, OTHER |

### Differentiators

Nice-to-have features that add value but are not expected.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI value extraction** | Auto-extract amounts from receipts/invoices | High | Claude Code integration; extract vendor, amount, date |
| **Folder organization** | Group documents by type or date | Medium | Already planned; folder structure by project |
| **Bulk upload** | Upload multiple files at once | Medium | Select multiple files; batch processing |
| **Document search** | Find documents by filename or extracted content | Medium | Full-text search across document metadata |
| **Version history** | Track document replacements | High | Store previous versions; overkill for small team |
| **OCR text extraction** | Search within document content | High | Requires external OCR service; expensive |
| **Expiry/retention dates** | Auto-archive or flag expired documents | Medium | Useful for compliance but not critical |
| **Document annotations** | Add notes to specific parts of document | High | Complex UI; not needed for receipts |
| **Sharing links** | Share document externally | Medium | Generate public/private links; security concern |
| **Mobile camera upload** | Snap photo directly from mobile | Medium | Good UX but web app already responsive |

### Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full document management system** | Overkill for 3-person team; scope creep | Simple attachment model linked to projects |
| **Complex folder hierarchies** | Hard to maintain; users get lost | Flat structure: one folder per project |
| **Document editing in-app** | Massive scope; use external tools | Download, edit externally, re-upload |
| **E-signatures** | Completely separate product domain | Out of scope; use DocuSign if needed |
| **Document approval workflows** | Overkill for small team | Simple upload = done |
| **Automated invoice parsing** | High complexity, low ROI for 3 users | Manual entry with optional AI assist |
| **Cloud storage sync (Dropbox, etc.)** | Adds complexity; NAS is sufficient | Direct upload to NAS storage |
| **Document collaboration** | Real-time editing is separate domain | Not needed for receipts/invoices |
| **Complex access controls per document** | Role-based at project level is sufficient | Inherit project-level permissions |
| **Watermarking** | Not needed for internal tool | Unnecessary complexity |

---

## Customizable Dashboard

### Table Stakes

Must-have features users expect for dashboard customization.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Widget bank/selector** | Users need to see available widgets | Medium | Panel showing all available widgets with previews |
| **Add/remove widgets** | Core customization capability | Medium | Click to add; X to remove |
| **Widget drag-and-drop positioning** | Intuitive rearrangement | Medium | Use react-grid-layout library |
| **Widget resize (standard sizes)** | Different widgets need different space | Medium | Small, medium, large presets; not pixel-perfect |
| **Layout persistence** | Changes should survive page refresh | Medium | Save to database per user |
| **Reset to default** | Undo customizations; safety net for experimentation | Low | One-click restore to admin default |
| **Admin default layout** | New users start with sensible dashboard | Medium | Admin can define starter layout |
| **Responsive behavior** | Dashboard works on mobile | High | Columns collapse on smaller screens |

### Differentiators

Nice-to-have features that add value but are not expected.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Role-based widget restrictions** | Control which roles see which widgets | Medium | Already planned; Admin restricts Viewer widgets |
| **Date range filter for dashboard** | Filter all widgets by time period | Medium | Already planned; global date picker |
| **Save multiple layouts** | Switch between different dashboard views | High | Multiple named layouts per user |
| **Share layout with team** | Propagate good layouts | Medium | Copy layout to other users |
| **Widget-specific date ranges** | Different time windows per widget | High | Complex UX; global filter is simpler |
| **Dashboard themes** | Light/dark mode toggle | Medium | Already have Tailwind dark mode support |
| **Export dashboard as PDF/image** | Share dashboard snapshot | Medium | Screenshot functionality |
| **Dashboard scheduling** | Auto-email dashboard summary | High | Background jobs; email integration |
| **Real-time data updates** | Live refresh without page reload | High | WebSocket or polling; adds complexity |
| **Widget animations** | Smooth transitions when data changes | Low | CSS transitions; subtle polish |

### Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Pixel-perfect positioning** | Complex; users don't need it | Grid-based snapping (12-column grid) |
| **Custom widget creation** | Massive scope; users become developers | Fixed set of pre-built widgets |
| **Complex visualization builder** | Separate BI product territory | Pre-designed chart widgets |
| **Drag from widget bank directly to canvas** | Technically complex | Add button inserts at next position |
| **Infinite canvas scrolling** | Confusing UX; no natural boundaries | Fixed dashboard area; scroll content inside widgets |
| **Widget-to-widget data linking** | Complex state management | Widgets are independent |
| **Undo/redo history** | High complexity for little value | Reset to default is sufficient |
| **Collaborative editing** | Real-time sync between users | Not needed; each user has own layout |
| **Multiple dashboard pages** | Scope creep; one dashboard is sufficient | Single customizable dashboard |
| **Granular widget permissions** | Role-based restrictions are enough | Don't need per-widget, per-user permissions |

---

## Feature Dependencies (v1.3)

```
Document Management:
  File upload API ----------------------> Document model in Prisma
  Document model -----------------------> Project relation
  Project detail page -----------------> Documents tab/section
  Upload component --------------------> File validation
  Download endpoint -------------------> File storage on NAS

Dashboard Customization:
  Layout persistence ------------------> UserDashboardLayout model
  Widget bank -------------------------> Widget registry (config)
  React Grid Layout ------------------> Dashboard component
  Role restrictions ------------------> Widget visibility config
  Admin default ----------------------> System default layout
  Reset to default -------------------> Fetch admin layout, save as user layout
  Date filter ------------------------> All KPI/chart data fetching
```

---

## MVP Recommendation (v1.3)

### Document Management MVP

**Build first (Phase 1):**
1. Document model with project relation (RECEIPT, INVOICE types)
2. Drag-drop upload with click fallback
3. File validation (types + size)
4. Document list on project detail
5. Download and delete functionality
6. Folder storage by project on NAS

**Defer to later:**
- AI value extraction (Phase 2 enhancement)
- Bulk upload (nice-to-have)
- Document search (if volume grows)

### Dashboard Customization MVP

**Build first (Phase 1):**
1. UserDashboardLayout model in Prisma
2. Widget registry with existing widgets
3. React Grid Layout integration
4. Add/remove widgets functionality
5. Drag-and-drop positioning
6. Layout save/load per user
7. Reset to default button
8. Admin default layout configuration

**Defer to later:**
- Role-based widget restrictions (Phase 2)
- Date range filter (Phase 2)
- Widget resize (Phase 2 enhancement)
- Dark mode toggle (minor polish)

---

## Existing Widgets to Include

Based on current dashboard (`src/app/(dashboard)/page.tsx`):

| Widget | Data Source | Current Size | Priority |
|--------|-------------|--------------|----------|
| KPI Cards (4 metrics) | Initiative stats | Full width | HIGH |
| Revenue Progress | Initiative calculations | Full width | HIGH |
| Status Chart | Initiative groupBy | Half width | HIGH |
| Department Chart | Initiative groupBy | Half width | HIGH |
| Team Workload | Initiative groupBy | Half width | MEDIUM |
| Recent Initiatives | Initiative findMany | Half width | MEDIUM |
| CRM KPI Cards (6 metrics) | Deal + Project stats | Full width | HIGH |
| Pipeline Stage Chart | Deal groupBy | Full width | HIGH |

### Potential New Widgets

| Widget | Data Source | Value | Priority |
|--------|-------------|-------|----------|
| Upcoming Deadlines List | Initiative where endDate | Quick action visibility | MEDIUM |
| Project Costs Summary | Cost aggregate | Financial oversight | LOW |
| Document Upload Activity | Document recent | Activity feed | LOW |
| Quick Add Button | N/A | Convenience | LOW |

---

## Technology Recommendations (v1.3)

### Document Upload

- **react-dropzone**: Well-maintained, lightweight drag-drop library
- **NAS storage**: Store files on Synology NAS via mounted volume
- **Prisma Document model**: Link to Project with type enum
- **No external storage**: Keep it simple; NAS is sufficient

### Dashboard Customization

- **react-grid-layout**: Industry standard for widget layouts
  - Draggable and resizable
  - Responsive breakpoints
  - Layout serialization
- **Prisma UserDashboardLayout**: Store layout JSON per user
- **Widget registry**: TypeScript config mapping widget IDs to components

---

## Sources (v1.3)

### Document Management
- [Klippa Invoice Management](https://www.klippa.com/en/blog/information/invoice-management-software/)
- [DocuWare Invoice Processing](https://start.docuware.com/blog/document-management/document-management-for-invoice-processing-a-beginners-guide)
- [SparkReceipt Features](https://sparkreceipt.com/features/receipt-organizer/)
- [Uploadcare File Uploader UX](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [LogRocket Drag-Drop Patterns](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)
- [Filestack Upload UI Guide](https://blog.filestack.com/building-modern-drag-and-drop-upload-ui/)
- [Access Corp File Management Mistakes](https://www.accesscorp.com/blog/common-file-management-mistakes-and-how-to-avoid-them/)

### Dashboard Customization
- [Justinmind Dashboard Design](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux)
- [Medium: Admin Dashboard Best Practices 2025](https://medium.com/@CarlosSmith24/admin-dashboard-ui-ux-best-practices-for-2025-8bdc6090c57d)
- [BricxLabs Dashboard Design Principles](https://bricxlabs.com/blogs/tips-for-dashboard-design)
- [UITop Dashboard Trends](https://uitop.design/blog/design/top-dashboard-design-trends/)
- [React Grid Layout GitHub](https://github.com/react-grid-layout/react-grid-layout)
- [AntStack React Grid Layout Tutorial](https://www.antstack.com/blog/building-customizable-dashboard-widgets-using-react-grid-layout/)
- [ilert: Why React Grid Layout](https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice)

---

## Confidence Assessment (v1.3)

| Area | Confidence | Reason |
|------|------------|--------|
| Document Table Stakes | HIGH | Well-established file upload patterns |
| Document Anti-Features | HIGH | Clear scope boundaries for small team |
| Dashboard Table Stakes | HIGH | Industry-standard customization patterns |
| Dashboard Anti-Features | HIGH | Strong consensus on avoiding complexity |
| Technology Stack | HIGH | react-grid-layout is proven; NAS storage is existing |
| Widget Registry | MEDIUM | Implementation details may need adjustment |

---

*Research completed: 2026-01-23*
