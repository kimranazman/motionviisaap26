# Phase 47: Seed Script Rewrite - Research

**Researched:** 2026-01-27
**Domain:** Prisma seed script, Excel parsing (xlsx), OKR data seeding with FK linkages
**Confidence:** HIGH

## Summary

Phase 47 rewrites `prisma/seed.ts` to populate the v2.0 OKR hierarchy from `MotionVii_SAAP_2026_v2.xlsx`. The Excel file has 5 sheets but only 3 contain seedable data: "Key Results" (6 rows), "Initiatives" (37 rows), and "Support Tasks" (30 rows). The v2 file does NOT contain an "Events to Attend" sheet -- that sheet only exists in the old `MotionVii_SAAP_2026.xlsx`. The seed must handle this gracefully.

The existing `seed.ts` already demonstrates the full pattern: read Excel with `xlsx` library, parse rows with column index mapping, normalize enum values, create records via Prisma. The rewrite extends this to: (1) wipe OKR data safely using `SET FOREIGN_KEY_CHECKS = 0`, (2) create KeyResult records first (parent), (3) create Initiatives with FK linkage to KeyResults, (4) create SupportTasks with join table entries to KeyResults including "All KRs" and "Parent company" special handling, (5) print validation summary.

Key parsing challenges are well-defined: KR Objective strings have trailing `\r\n` that must be trimmed, the "Supports" column uses comma-separated KR IDs plus "All KRs" and "Parent company" as special values, dates are Excel serial numbers, budget values are numeric in Excel but stored as String in the schema, and progress values like "0%" must be parsed to Decimal.

**Primary recommendation:** Rewrite `prisma/seed.ts` as a single file that reads from `MotionVii_SAAP_2026_v2.xlsx`, seeds in dependency order (KeyResults -> Initiatives -> SupportTasks + join records), handles the old Events to Attend by reading from the original Excel file (preserving existing behavior), and prints a comprehensive validation summary.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xlsx | 0.18.5 | Excel file parsing | Already in project, used by existing seed.ts |
| @prisma/client | 6.19.2 | Database operations | Only ORM in project |
| ts-node | 10.9.2 | TypeScript execution | Used by prisma.seed config in package.json |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| path | builtin | File path resolution | Resolving Excel file paths relative to prisma dir |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single seed.ts file | Modular seed files (seed-kr.ts, seed-init.ts, etc.) | Extra complexity; the project convention is single seed.ts. Admin and categories have separate files because they serve different purposes. |
| ts-node (current runner) | tsx (used by seed-admin.ts) | tsx is faster but package.json prisma.seed is configured for ts-node. Changing the runner is out of scope. |
| xlsx library | exceljs, SheetJS Pro | xlsx is already installed and working. No reason to switch. |

**Installation:**
```bash
# No new packages needed -- all already installed
```

## Architecture Patterns

### Recommended Seed Script Structure

```
prisma/
  seed.ts                    # Main seed script (REWRITTEN for v2.0)
  seed-admin.ts              # Unchanged -- separate admin user seeding
  seed-cost-categories.ts    # Unchanged -- separate cost category seeding
```

The seed.ts file should follow this internal structure:

```typescript
// 1. Imports and Prisma client setup
// 2. Excel file reader (both v2 and v1 files)
// 3. Normalization/parsing helper functions
// 4. Header validation function
// 5. Main seeding function with this order:
//    a. Wipe OKR data (FK_CHECKS=0)
//    b. Seed KeyResults (6 records)
//    c. Build KR lookup map: krId -> cuid
//    d. Seed Initiatives (37 records) using KR lookup
//    e. Seed SupportTasks (30 records)
//    f. Seed SupportTaskKeyResult join records using KR lookup
//    g. Seed EventsToAttend from OLD Excel file (preserving existing behavior)
//    h. Print validation summary
// 6. Error handling wrapper
```

### Pattern 1: Dependency-Ordered Seeding

**What:** Seed parent records before children; build lookup maps for FK resolution.
**When to use:** Always when seeding relational data.
**Example:**
```typescript
// Source: v2.0 Pitfalls doc pattern
// Step 1: Create KeyResults first
const krMap = new Map<string, string>(); // "KR1.1" -> cuid
for (const krData of keyResultRows) {
  const kr = await prisma.keyResult.create({ data: krData });
  krMap.set(kr.krId, kr.id);
}

// Step 2: Create Initiatives with FK lookup
for (const initData of initiativeRows) {
  const keyResultId = krMap.get(initData.krReference);
  if (!keyResultId) {
    warnings.push(`Initiative #${initData.id}: KR "${initData.krReference}" not found`);
    continue;
  }
  await prisma.initiative.create({
    data: { ...initData, keyResultId }
  });
}
```

### Pattern 2: FK_CHECKS=0 Wipe Pattern (MariaDB/MySQL)

**What:** Disable FK constraint checking during data wipe to avoid ordering issues.
**When to use:** When wiping tables with circular or deep FK chains.
**Example:**
```typescript
// Source: .planning/research/v2.0-PITFALLS.md (C2 prevention)
await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
try {
  await prisma.supportTaskKeyResult.deleteMany();
  await prisma.supportTask.deleteMany();
  // Delete comments on initiatives before deleting initiatives
  await prisma.comment.deleteMany();
  // Null out initiative links on projects (don't delete projects!)
  await prisma.project.updateMany({
    where: { initiativeId: { not: null } },
    data: { initiativeId: null }
  });
  await prisma.initiative.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.eventToAttend.deleteMany();
} finally {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
}
```

### Pattern 3: Comma-Separated KR Reference Parsing

**What:** Parse the "Supports" column which has three distinct value patterns.
**When to use:** For every Support Task row.
**Example:**
```typescript
// Source: Excel data analysis -- 3 patterns found
function parseSupportsColumn(value: string, krMap: Map<string, string>): string[] {
  const trimmed = value.trim();

  // Pattern 1: "All KRs" -> link to all 6 KRs
  if (trimmed.toLowerCase() === 'all krs') {
    return Array.from(krMap.values());
  }

  // Pattern 2: "Parent company" -> no KR links (these are Talenta support tasks)
  if (trimmed.toLowerCase() === 'parent company') {
    return []; // No KR linkage
  }

  // Pattern 3: "KR1.1" or "KR1.1, KR1.3" -> parse comma-separated
  return trimmed.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(krId => {
      const id = krMap.get(krId);
      if (!id) warnings.push(`Support task: KR "${krId}" not found in lookup`);
      return id;
    })
    .filter((id): id is string => id !== undefined);
}
```

### Pattern 4: Header Validation Before Parsing

**What:** Verify expected column headers before parsing to catch Excel structure changes.
**When to use:** For each sheet before row processing.
**Example:**
```typescript
// Source: SEED-02 requirement "Validate headers before parsing"
function validateHeaders(actual: any[], expected: string[], sheetName: string): void {
  const mismatches: string[] = [];
  for (let i = 0; i < expected.length; i++) {
    const actualHeader = actual[i]?.toString().trim() || '';
    if (actualHeader !== expected[i]) {
      mismatches.push(`Col ${i}: expected "${expected[i]}", got "${actualHeader}"`);
    }
  }
  if (mismatches.length > 0) {
    console.warn(`WARNING: ${sheetName} header mismatches:\n  ${mismatches.join('\n  ')}`);
  }
}
```

### Anti-Patterns to Avoid

- **Creating records one-by-one without a lookup map:** Must build KR lookup BEFORE processing initiatives and support tasks. Processing in isolation leads to FK resolution failures.
- **Using `prisma.initiative.deleteMany()` without FK_CHECKS=0:** The Comment model has `onDelete: Cascade` from Initiative, which works. But projects have `initiativeId` FK that would be violated. Must null out project links first or use FK_CHECKS=0.
- **Ignoring "Parent company" support tasks:** 4 of 30 support tasks (IDs 23-26) have "Parent company" in the Supports column, NOT KR IDs. These tasks should be created but get zero join table entries.
- **Hardcoding row indices without header validation:** The Excel structure could change. Always validate headers match expectations.
- **Seeding from the wrong Excel file:** The v2 seed MUST use `MotionVii_SAAP_2026_v2.xlsx`, NOT `MotionVii_SAAP_2026.xlsx`. Events to Attend are in the OLD file only.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel date parsing | Custom date math | Existing `parseExcelDate()` from current seed.ts | Already handles serial numbers, Date objects, and string dates correctly |
| Excel file reading | Raw file parsing | `XLSX.readFile()` + `sheet_to_json(ws, { header: 1 })` | Already proven in project; returns clean array-of-arrays |
| Enum normalization | Manual switch/case | Lookup map pattern (as in existing seed.ts) | Flexible, handles typos and variations, easy to extend |
| FK constraint handling | Custom delete ordering | `$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')` | MariaDB-native, avoids complex dependency graph analysis |

**Key insight:** The existing `seed.ts` already has robust patterns for every helper function needed (parseExcelDate, parseCost, normalizeStatus, etc.). The rewrite extends these patterns to new models and sheets rather than inventing new approaches.

## Common Pitfalls

### Pitfall 1: Trailing \r\n in KR Objective Column

**What goes wrong:** The "Objective" column in the Key Results sheet has trailing `\r\n` characters on "Scale Events Business" entries (KR1.1, KR1.2, KR1.3). Character codes confirmed: last 3 chars are [115, 13, 10] = "s\r\n". The "Build AI Training Business" entries do NOT have trailing whitespace.
**Why it happens:** Excel cell formatting artifacts from multiline content in the source cell.
**How to avoid:** Always `.trim()` all string values parsed from Excel. The normalizeObjective function must trim before matching.
**Warning signs:** Objective enum mapping fails for KR1.x entries; all KRs end up as OBJ1_SCALE_EVENTS or default.

### Pitfall 2: "Parent company" Support Tasks Have No KR Linkage

**What goes wrong:** 4 support tasks (IDs 23-26, category "Talenta Ideas") have "Parent company" in the Supports column instead of KR references. If the parser tries to resolve "Parent company" as a KR ID, it will fail.
**Why it happens:** These are subsidiary support tasks for the parent company (Talenta Ideas), not linked to any specific OKR.
**How to avoid:** Explicitly handle "Parent company" as a valid value that produces zero join table entries. Create the SupportTask record but skip SupportTaskKeyResult creation.
**Warning signs:** Parse warnings about "Parent company" not found in KR lookup map.

### Pitfall 3: Budget Column is Numeric in Excel but String in Schema

**What goes wrong:** The Excel "Budget (RM)" column contains numeric values (1400, 1800, 10000, etc.) that xlsx parses as JavaScript numbers. But the schema field is `budget String? @db.VarChar(255)`. If you pass a number to Prisma where it expects a string, it may fail or produce unexpected results.
**Why it happens:** The schema uses String for budget (per requirements) because it may contain non-numeric text in future, but the current Excel data is purely numeric.
**How to avoid:** Convert budget to string: `budget: row[7] != null ? String(row[7]) : null`. Or format with commas: `budget: row[7] != null ? row[7].toLocaleString() : null`.
**Warning signs:** Prisma type errors on create, or budget showing as "1400" instead of "RM 1,400".

### Pitfall 4: KR Progress Column is Percentage String

**What goes wrong:** The Key Results "Progress %" column contains values like "0%" (string with % suffix). The schema field is `progress Decimal @default(0) @db.Decimal(5, 2)` which expects a numeric value 0-100.
**Why it happens:** Excel formatted the cell as percentage text, not as a number.
**How to avoid:** Parse the percentage string: `parseFloat(value.replace('%', ''))`. If all values are currently "0%", the default(0) in the schema would work, but the parser should handle non-zero values correctly.
**Warning signs:** Decimal parse errors or all progress values staying at 0.

### Pitfall 5: Initiative Status is "Pending" Not "Not Started"

**What goes wrong:** All 37 initiatives in the v2 Excel have status "Pending", but the InitiativeStatus enum does not have a "PENDING" value. The existing normalizeStatus function maps "pending" to NOT_STARTED, which is correct behavior.
**Why it happens:** Excel uses human-readable status text that doesn't match enum values exactly.
**How to avoid:** Reuse the existing normalizeStatus function which already handles this mapping.
**Warning signs:** None if existing function is reused. If you write a new mapper without this edge case, all initiatives will get a default status.

### Pitfall 6: v2 Excel Has No Events to Attend Sheet

**What goes wrong:** The v2 Excel file (`MotionVii_SAAP_2026_v2.xlsx`) has 5 sheets: "OKR Summary", "Key Results", "Initiatives", "Structure Guide", "Support Tasks". There is NO "Events to Attend" sheet. The old file (`MotionVii_SAAP_2026.xlsx`) has it.
**Why it happens:** The v2 file was restructured for OKR focus. Events data was not carried over.
**How to avoid:** For SEED-05, either: (a) Read Events to Attend from the old Excel file separately, or (b) Skip event seeding if the v2 file is the only source. The existing seed.ts already handles the case where the sheet is missing (line 263: `console.log('Events to Attend sheet not found')`).
**Warning signs:** Events to Attend table is empty after seeding if not handled.

### Pitfall 7: Department "Business Dev" Needs New Enum Mapping

**What goes wrong:** The v2 Initiatives Excel uses "Business Dev" for department, but the existing normalizeDepartment function maps "business development" to BIZ_DEV. The string "Business Dev" also needs to map correctly.
**Why it happens:** The v2 Excel uses abbreviated department names compared to v1.
**How to avoid:** The existing normalizeDepartment already handles "biz dev" (normalized). Since "Business Dev".toLowerCase().trim() = "business dev", and the map has "business development" but NOT "business dev", a new mapping entry is needed: `'business dev': InitiativeDepartment.BIZ_DEV`.
**Warning signs:** All "Business Dev" initiatives get default BIZ_DEV (coincidentally correct in this case, but fragile).

### Pitfall 8: Project.initiativeId Links Must Be Preserved

**What goes wrong:** The `initiative.deleteMany()` would leave `projects.initiative_id` as a dangling FK. While FK_CHECKS=0 prevents the error, after re-enabling FK checks, any project with an old initiativeId pointing to a deleted initiative would have an orphaned FK.
**Why it happens:** Projects can be linked to initiatives via `initiativeId`. When initiatives are deleted and recreated with new CUIDs, the old links break.
**How to avoid:** Before deleting initiatives, null out all project initiativeId values: `prisma.project.updateMany({ where: { initiativeId: { not: null } }, data: { initiativeId: null } })`. This preserves projects but removes the initiative link (which will need to be re-established manually or through a later phase).
**Warning signs:** FK constraint violations when FK_CHECKS is re-enabled, or projects showing broken initiative links.

## Code Examples

Verified patterns from the existing codebase and Excel data analysis:

### Excel Column Mappings (Verified from v2 Excel)

```typescript
// KEY RESULTS sheet: Header at row index 2, data starts at row index 3
// Columns: [0]KR ID, [1]Objective, [2]Key Result Description, [3]Metric Type,
//          [4]Target, [5]Actual, [6]Unit, [7]Progress %, [8]Deadline,
//          [9]Status, [10]Owner, [11]How We Measure, [12]Notes
const KR_HEADER_ROW = 2;
const KR_DATA_START = 3;
const KR_EXPECTED_HEADERS = [
  'KR ID', 'Objective', 'Key Result Description', 'Metric Type',
  'Target', 'Actual', 'Unit', 'Progress %', 'Deadline',
  'Status', 'Owner', 'How We Measure', 'Notes'
];

// INITIATIVES sheet: Header at row index 2, data starts at row index 3
// Columns: [0]ID, [1]KR, [2]Objective, [3]Initiative, [4]Department,
//          [5]Start Date, [6]End Date, [7]Budget (RM), [8]Resources,
//          [9]Person In Charge, [10]Accountable, [11]Status, [12]Progress, [13]Remarks
const INIT_HEADER_ROW = 2;
const INIT_DATA_START = 3;
const INIT_EXPECTED_HEADERS = [
  'ID', 'KR', 'Objective', 'Initiative', 'Department',
  'Start Date', 'End Date', 'Budget (RM)', 'Resources',
  'Person In Charge', 'Accountable', 'Status', 'Progress', 'Remarks'
];

// SUPPORT TASKS sheet: Header at row index 3, data starts at row index 4
// Columns: [0]ID, [1]Category, [2]Task, [3]Supports, [4]Owner,
//          [5]Frequency, [6]Priority, [7]Notes
const ST_HEADER_ROW = 3;
const ST_DATA_START = 4;
const ST_EXPECTED_HEADERS = [
  'ID', 'Category', 'Task', 'Supports', 'Owner',
  'Frequency', 'Priority', 'Notes'
];
```

### Enum Normalization Functions (New for v2.0)

```typescript
// Source: Excel data analysis -- exact values found in v2 Excel
function normalizeMetricType(value: string | null | undefined): MetricType {
  if (!value) return MetricType.COUNT;
  const normalized = value.toString().toLowerCase().trim();
  if (normalized === 'revenue') return MetricType.REVENUE;
  return MetricType.COUNT;
}

function normalizeKeyResultStatus(value: string | null | undefined): KeyResultStatus {
  if (!value) return KeyResultStatus.NOT_STARTED;
  const normalized = value.toString().toLowerCase().trim().replace(/\s+/g, '_');
  const map: Record<string, KeyResultStatus> = {
    'not_started': KeyResultStatus.NOT_STARTED,
    'not started': KeyResultStatus.NOT_STARTED,
    'on_track': KeyResultStatus.ON_TRACK,
    'on track': KeyResultStatus.ON_TRACK,
    'at_risk': KeyResultStatus.AT_RISK,
    'at risk': KeyResultStatus.AT_RISK,
    'behind': KeyResultStatus.BEHIND,
    'achieved': KeyResultStatus.ACHIEVED,
  };
  return map[normalized] || KeyResultStatus.NOT_STARTED;
}

function normalizeSupportTaskCategory(value: string | null | undefined): SupportTaskCategory {
  if (!value) return SupportTaskCategory.OPERATIONS;
  const normalized = value.toString().toLowerCase().trim();
  // Exact values from Excel: "Design & Creative", "Business & Admin", "Talenta Ideas", "Operations"
  if (normalized.includes('design')) return SupportTaskCategory.DESIGN_CREATIVE;
  if (normalized.includes('business') || normalized.includes('admin')) return SupportTaskCategory.BUSINESS_ADMIN;
  if (normalized.includes('talenta')) return SupportTaskCategory.TALENTA_IDEAS;
  return SupportTaskCategory.OPERATIONS;
}

function normalizeTaskPriority(value: string | null | undefined): TaskPriority {
  if (!value) return TaskPriority.MEDIUM;
  const normalized = value.toString().toLowerCase().trim();
  if (normalized === 'high') return TaskPriority.HIGH;
  if (normalized === 'low') return TaskPriority.LOW;
  return TaskPriority.MEDIUM;
}

// Progress: "0%" -> 0.00
function parseProgress(value: any): number {
  if (!value) return 0;
  const str = value.toString().replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}
```

### Complete Wipe Sequence (Dependency-Safe)

```typescript
// Source: v2.0 Pitfalls doc + schema analysis
async function wipeOkrData(prisma: PrismaClient): Promise<void> {
  console.log('Wiping OKR data...');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  try {
    // Join tables first
    const stKrCount = await prisma.supportTaskKeyResult.deleteMany();
    console.log(`  Deleted ${stKrCount.count} support task-KR links`);

    // Child records
    const stCount = await prisma.supportTask.deleteMany();
    console.log(`  Deleted ${stCount.count} support tasks`);

    // Comments on initiatives (cascade would handle this, but be explicit)
    const commentCount = await prisma.comment.deleteMany();
    console.log(`  Deleted ${commentCount.count} comments`);

    // Null out project initiative links (preserve projects!)
    const projectUpdate = await prisma.project.updateMany({
      where: { initiativeId: { not: null } },
      data: { initiativeId: null },
    });
    if (projectUpdate.count > 0) {
      console.log(`  Unlinked ${projectUpdate.count} projects from initiatives`);
    }

    // Now safe to delete initiatives
    const initCount = await prisma.initiative.deleteMany();
    console.log(`  Deleted ${initCount.count} initiatives`);

    // Finally delete key results
    const krCount = await prisma.keyResult.deleteMany();
    console.log(`  Deleted ${krCount.count} key results`);

    // Events to attend (separate from OKR but included in seed)
    const eventCount = await prisma.eventToAttend.deleteMany();
    console.log(`  Deleted ${eventCount.count} events to attend`);
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  }
}
```

### Support Task "Supports" Column Values (All 12 Unique Values Found)

```typescript
// Source: Excel data analysis -- complete list
// Single KR:     "KR1.1", "KR1.2", "KR1.3", "KR2.1", "KR2.2", "KR2.3"
// Multi KR:      "KR1.1, KR1.2", "KR1.1, KR1.3", "KR1.1, KR2.2", "KR1.2, KR2.2"
// All KRs:       "All KRs"         -> 5 tasks (IDs: 15, 27, 28, 29, 30)
// Parent company: "Parent company"  -> 4 tasks (IDs: 23, 24, 25, 26)

// Expected join table entries:
// 5 tasks x 6 KRs (All KRs) = 30 entries
// 7 tasks x 2 KRs (multi)   = 14 entries
// 14 tasks x 1 KR (single)  = 14 entries
// 4 tasks x 0 KRs (Parent)  = 0 entries
// Total: 30 + 14 + 14 = 58 join table entries
```

### Seed Validation Summary Pattern

```typescript
// Source: SEED-06 requirement
async function printValidationSummary(prisma: PrismaClient, warnings: string[]): Promise<void> {
  console.log('\n========================================');
  console.log('SEED VALIDATION SUMMARY');
  console.log('========================================');

  const krCount = await prisma.keyResult.count();
  const initCount = await prisma.initiative.count();
  const stCount = await prisma.supportTask.count();
  const joinCount = await prisma.supportTaskKeyResult.count();
  const eventCount = await prisma.eventToAttend.count();

  console.log(`KeyResults:              ${krCount} (expected: 6)`);
  console.log(`Initiatives:             ${initCount} (expected: 37)`);
  console.log(`SupportTasks:            ${stCount} (expected: 30)`);
  console.log(`SupportTask-KR links:    ${joinCount} (expected: 58)`);
  console.log(`EventsToAttend:          ${eventCount}`);

  // Verify FK linkages
  const unlinkedInit = await prisma.initiative.count({ where: { keyResultId: null } });
  if (unlinkedInit > 0) {
    console.log(`\nWARNING: ${unlinkedInit} initiatives have no KeyResult link!`);
  } else {
    console.log(`\nAll initiatives linked to KeyResults: OK`);
  }

  // Verify KR distribution
  const krGroups = await prisma.initiative.groupBy({
    by: ['keyResultId'],
    _count: true,
  });
  console.log(`\nInitiatives per KeyResult:`);
  for (const g of krGroups) {
    const kr = await prisma.keyResult.findUnique({ where: { id: g.keyResultId! }, select: { krId: true } });
    console.log(`  ${kr?.krId || 'UNKNOWN'}: ${g._count} initiatives`);
  }

  if (warnings.length > 0) {
    console.log(`\nPARSING WARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  } else {
    console.log(`\nNo parsing warnings.`);
  }

  console.log('========================================\n');
}
```

## Excel Data Summary (Verified)

### Key Results Sheet (6 records)

| KR ID | Objective | Metric | Target | Unit | Deadline |
|-------|-----------|--------|--------|------|----------|
| KR1.1 | Scale Events Business | Revenue | 800000 | RM | Q4 2026 |
| KR1.2 | Scale Events Business | Count | 3 | active partnerships | Q3 2026 |
| KR1.3 | Scale Events Business | Count | 3 | repeat/referred clients | Q4 2026 |
| KR2.1 | Build AI Training Business | Count | 20 | paid sessions | Q4 2026 |
| KR2.2 | Build AI Training Business | Revenue | 200000 | RM | Q4 2026 |
| KR2.3 | Build AI Training Business | Count | 5 | repeat/referred clients | Q4 2026 |

**Data quality notes:**
- All status values are "Not Started", all actual values are 0, all progress is "0%"
- KR1.x Objective values have trailing `\r\n` -- MUST trim
- All owners are "Khairul" except KR1.2 which is "Azlan" (wait -- re-checked: KR1.2 is "Khairul" in detailed sheet, "Azlan" in OKR Summary. Use Key Results sheet values)

### Initiatives Sheet (37 records)

- **KR distribution:** KR1.1 (8), KR1.2 (6), KR1.3 (4), KR2.1 (7), KR2.2 (8), KR2.3 (4)
- **Department values:** "Operations", "Business Dev", "Marketing"
- **PIC values:** "Azlan", "Khairul" (maps to TeamMember enum)
- **Accountable:** All "Khairul" (maps to TeamMember.KHAIRUL)
- **Status:** All "Pending" (maps to NOT_STARTED)
- **Budget:** 9 of 37 have budget values (numeric: 1400, 1800, 2000, 3000, 5000x3, 10000, 60000)
- **Resources:** 9 of 37 have resource text strings
- **Remarks:** 23 of 37 have remarks text
- **Dates:** Excel serial numbers (e.g., 46023 = 2026-01-01, 46387 = 2026-12-31)

### Support Tasks Sheet (30 records)

- **Categories:** "Design & Creative" (11), "Business & Admin" (11), "Talenta Ideas" (4), "Operations" (4)
- **Supports patterns:** Single KR (14), Multi KR (7), "All KRs" (5), "Parent company" (4)
- **Expected join entries:** 58 total (30 from "All KRs", 14 from multi, 14 from single)
- **Owner values:** "Azlan", "Khairul"
- **Priority values:** "High", "Medium", "Low"
- **Frequency values:** 21 unique values (too varied for enum -- confirmed decision to use String)
- **Notes:** All 30 tasks have notes

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single sheet parsing (SAAP sheet) | Multi-sheet parsing (Key Results, Initiatives, Support Tasks) | Phase 47 | New Excel structure with 3 data sheets |
| `initiative.deleteMany()` only | FK_CHECKS=0 + dependency-order wipe | Phase 47 | Prevents FK constraint errors with new relations |
| No FK linkage in seed | KR lookup map for Initiative.keyResultId | Phase 47 | First time seed creates FK-linked records |
| No join table seeding | SupportTaskKeyResult entries | Phase 47 | Many-to-many "All KRs" and comma-separated parsing |
| Single Excel file | Two Excel files (v2 for OKR, v1 for Events) | Phase 47 | Events to Attend sheet only in old file |

**Deprecated/outdated:**
- Old column mappings from `MotionVii_SAAP_2026.xlsx` SAAP sheet (columns A-O with different layout)
- `keyResult` as plain string field on Initiative (replaced by FK to KeyResult model)
- KPI fields parsing (removed from Initiative model)

## Open Questions

1. **Events to Attend source file**
   - What we know: v2 Excel has no Events to Attend sheet. Old Excel has it with existing parsing code.
   - What's unclear: Should we read Events from the old file, skip events entirely, or keep existing event records?
   - Recommendation: Read from old file (`MotionVii_SAAP_2026.xlsx`) if it exists, skip gracefully if not. This preserves existing event seeding behavior with minimal code change.

2. **Budget formatting**
   - What we know: Excel has numeric values (1400, 10000). Schema stores as String.
   - What's unclear: Should budget be stored as "1400" or "RM 1,400" or "1400.00"?
   - Recommendation: Store as plain string of the number (`String(value)` = "1400"). Let the UI format for display. This avoids formatting decisions in the seed.

3. **Expected join table count verification**
   - What we know: Manual count gives 58 join entries (30 from "All KRs" + 14 multi + 14 single).
   - What's unclear: Is 58 the exact expected count? Depends on correct parsing of all 30 rows.
   - Recommendation: Compute expected count dynamically during parsing and compare to actual count in validation summary.

## Sources

### Primary (HIGH confidence)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/MotionVii_SAAP_2026_v2.xlsx` -- All 5 sheets analyzed: column headers, data types, unique values, row counts, special characters verified
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/prisma/seed.ts` -- Existing seed script (294 lines) -- all helper functions, patterns, and column mappings analyzed
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/prisma/schema.prisma` -- Complete v2.0 schema (894 lines) with KeyResult, SupportTask, SupportTaskKeyResult models already created by Phase 46
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/package.json` -- Confirmed ts-node runner, xlsx dependency, prisma.seed configuration
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/research/v2.0-PITFALLS.md` -- C2 (cascade deletes) prevention pattern with exact code
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/phases/46-schema-migration/46-RESEARCH.md` -- Phase 46 decisions (db push, String owner, kept old fields)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/REQUIREMENTS.md` -- SEED-01 through SEED-06 requirements

### Secondary (MEDIUM confidence)
- None -- all findings from direct source code and Excel analysis

### Tertiary (LOW confidence)
- None -- no external sources needed; this is internal data migration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- xlsx 0.18.5 already in project, all patterns from existing seed.ts
- Architecture: HIGH -- Excel column mappings verified by parsing actual data; all unique values catalogued
- Pitfalls: HIGH -- 8 pitfalls identified from direct analysis of Excel data (trailing \r\n, "Parent company", budget types) and schema relationships (FK constraints, cascades)
- Data mapping: HIGH -- Every Excel column value enumerated and validated against schema field types and enum values

**Research date:** 2026-01-27
**Valid until:** 2026-03-27 (60 days -- Excel data and schema are stable; seed logic is deterministic)
