import {
  PrismaClient,
  InitiativeStatus,
  Objective,
  InitiativeDepartment,
  TeamMember,
  EventPriority,
  EventCategory,
  EventStatus,
  KeyResultStatus,
  MetricType,
  SupportTaskCategory,
  TaskPriority,
} from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'

const prisma = new PrismaClient()

// ============================================================
// Helper Functions
// ============================================================

// Map Excel status values to InitiativeStatus enum
function normalizeStatus(status: string | null | undefined): InitiativeStatus {
  if (!status) return InitiativeStatus.NOT_STARTED
  const normalized = status.toString().toLowerCase().trim().replace(/\s+/g, '_')
  const statusMap: Record<string, InitiativeStatus> = {
    'not_started': InitiativeStatus.NOT_STARTED,
    'not started': InitiativeStatus.NOT_STARTED,
    'notstarted': InitiativeStatus.NOT_STARTED,
    'pending': InitiativeStatus.NOT_STARTED,
    'in_progress': InitiativeStatus.IN_PROGRESS,
    'in progress': InitiativeStatus.IN_PROGRESS,
    'inprogress': InitiativeStatus.IN_PROGRESS,
    'on_hold': InitiativeStatus.ON_HOLD,
    'on hold': InitiativeStatus.ON_HOLD,
    'onhold': InitiativeStatus.ON_HOLD,
    'at_risk': InitiativeStatus.AT_RISK,
    'at risk': InitiativeStatus.AT_RISK,
    'atrisk': InitiativeStatus.AT_RISK,
    'completed': InitiativeStatus.COMPLETED,
    'done': InitiativeStatus.COMPLETED,
    'cancelled': InitiativeStatus.CANCELLED,
    'canceled': InitiativeStatus.CANCELLED,
  }
  return statusMap[normalized] || InitiativeStatus.NOT_STARTED
}

// Map Excel objective values to Objective enum
function normalizeObjective(objective: string | null | undefined): Objective {
  if (!objective) return Objective.OBJ1_SCALE_EVENTS
  const normalized = objective.toString().toLowerCase().trim()
  if (normalized.includes('obj 1') || normalized.includes('scale events') || normalized.includes('obj1')) {
    return Objective.OBJ1_SCALE_EVENTS
  }
  if (normalized.includes('obj 2') || normalized.includes('ai training') || normalized.includes('obj2')) {
    return Objective.OBJ2_BUILD_AI_TRAINING
  }
  return Objective.OBJ1_SCALE_EVENTS
}

// Map Excel department values to InitiativeDepartment enum
function normalizeDepartment(department: string | null | undefined): InitiativeDepartment {
  if (!department) return InitiativeDepartment.BIZ_DEV
  const normalized = department.toString().toLowerCase().trim()
  const deptMap: Record<string, InitiativeDepartment> = {
    'biz dev': InitiativeDepartment.BIZ_DEV,
    'bizdev': InitiativeDepartment.BIZ_DEV,
    'business development': InitiativeDepartment.BIZ_DEV,
    'business dev': InitiativeDepartment.BIZ_DEV, // Pitfall 7: v2 Excel uses abbreviated name
    'operations': InitiativeDepartment.OPERATIONS,
    'ops': InitiativeDepartment.OPERATIONS,
    'finance': InitiativeDepartment.FINANCE,
    'fin': InitiativeDepartment.FINANCE,
    'marketing': InitiativeDepartment.MARKETING,
    'mkt': InitiativeDepartment.MARKETING,
  }
  return deptMap[normalized] || InitiativeDepartment.BIZ_DEV
}

// Map Excel team member values to TeamMember enum
function normalizeTeamMember(member: string | null | undefined): TeamMember | null {
  if (!member) return null
  const normalized = member.toString().toLowerCase().trim()
  const memberMap: Record<string, TeamMember> = {
    'khairul': TeamMember.KHAIRUL,
    'azlan': TeamMember.AZLAN,
    'izyani': TeamMember.IZYANI,
  }
  return memberMap[normalized] || null
}

// Parse Excel serial date to JavaScript Date
function parseExcelDate(value: any): Date {
  if (!value) return new Date('2026-01-01')

  // If it's already a Date object
  if (value instanceof Date) return value

  // If it's a string date
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) return parsed
  }

  // If it's an Excel serial number
  if (typeof value === 'number') {
    // Excel dates are days since Jan 1, 1900 (with leap year bug)
    const utcDays = Math.floor(value - 25569)
    const utcValue = utcDays * 86400 * 1000
    return new Date(utcValue)
  }

  return new Date('2026-01-01')
}

// Parse cost value
function parseCost(value: any): number | null {
  if (!value) return null
  if (typeof value === 'number') return value

  const str = value.toString()
    .replace(/[RM\s,]/gi, '')
    .trim()

  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Map Excel priority values to EventPriority enum
function normalizeEventPriority(priority: string | null | undefined): EventPriority {
  if (!priority) return EventPriority.TIER_3
  const normalized = priority.toString().toLowerCase().trim()
  if (normalized.includes('tier 1') || normalized === 'tier1') return EventPriority.TIER_1
  if (normalized.includes('tier 2') || normalized === 'tier2') return EventPriority.TIER_2
  if (normalized.includes('tier 3') || normalized === 'tier3') return EventPriority.TIER_3
  if (normalized.includes('energy')) return EventPriority.ENERGY
  return EventPriority.TIER_3
}

// Map Excel category values to EventCategory enum
function normalizeEventCategory(category: string | null | undefined): EventCategory {
  if (!category) return EventCategory.EVENTS
  const normalized = category.toString().toLowerCase().trim()
  if (normalized === 'both') return EventCategory.BOTH
  if (normalized.includes('ai') || normalized.includes('training')) return EventCategory.AI_TRAINING
  return EventCategory.EVENTS
}

// Map Excel status values to EventStatus enum
function normalizeEventStatus(status: string | null | undefined): EventStatus {
  if (!status) return EventStatus.PLANNED
  const normalized = status.toString().toLowerCase().trim()
  if (normalized.includes('register')) return EventStatus.REGISTERED
  if (normalized.includes('attend')) return EventStatus.ATTENDED
  if (normalized.includes('cancel')) return EventStatus.CANCELLED
  if (normalized.includes('skip')) return EventStatus.SKIPPED
  return EventStatus.PLANNED
}

// ============================================================
// New v2.0 Helper Functions
// ============================================================

// Map Excel metric type values to MetricType enum
function normalizeMetricType(value: string | null | undefined): MetricType {
  if (!value) return MetricType.COUNT
  const normalized = value.toString().toLowerCase().trim()
  if (normalized === 'revenue') return MetricType.REVENUE
  return MetricType.COUNT
}

// Map Excel KR status values to KeyResultStatus enum
function normalizeKeyResultStatus(value: string | null | undefined): KeyResultStatus {
  if (!value) return KeyResultStatus.NOT_STARTED
  const normalized = value.toString().toLowerCase().trim().replace(/\s+/g, '_')
  const map: Record<string, KeyResultStatus> = {
    'not_started': KeyResultStatus.NOT_STARTED,
    'not started': KeyResultStatus.NOT_STARTED,
    'on_track': KeyResultStatus.ON_TRACK,
    'on track': KeyResultStatus.ON_TRACK,
    'at_risk': KeyResultStatus.AT_RISK,
    'at risk': KeyResultStatus.AT_RISK,
    'behind': KeyResultStatus.BEHIND,
    'achieved': KeyResultStatus.ACHIEVED,
  }
  return map[normalized] || KeyResultStatus.NOT_STARTED
}

// Map Excel category values to SupportTaskCategory enum
function normalizeSupportTaskCategory(value: string | null | undefined): SupportTaskCategory {
  if (!value) return SupportTaskCategory.OPERATIONS
  const normalized = value.toString().toLowerCase().trim()
  if (normalized.includes('design')) return SupportTaskCategory.DESIGN_CREATIVE
  if (normalized.includes('business') || normalized.includes('admin')) return SupportTaskCategory.BUSINESS_ADMIN
  if (normalized.includes('talenta')) return SupportTaskCategory.TALENTA_IDEAS
  return SupportTaskCategory.OPERATIONS
}

// Map Excel priority values to TaskPriority enum
function normalizeTaskPriority(value: string | null | undefined): TaskPriority {
  if (!value) return TaskPriority.MEDIUM
  const normalized = value.toString().toLowerCase().trim()
  if (normalized === 'high') return TaskPriority.HIGH
  if (normalized === 'low') return TaskPriority.LOW
  return TaskPriority.MEDIUM
}

// Parse progress percentage string (e.g. "0%" -> 0)
function parseProgress(value: any): number {
  if (!value) return 0
  const str = value.toString().replace('%', '').trim()
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

// Validate sheet headers match expected columns
function validateHeaders(actual: any[], expected: string[], sheetName: string): void {
  const mismatches: string[] = []
  for (let i = 0; i < expected.length; i++) {
    const actualHeader = actual[i]?.toString().trim() || ''
    if (actualHeader !== expected[i]) {
      mismatches.push(`Col ${i}: expected "${expected[i]}", got "${actualHeader}"`)
    }
  }
  if (mismatches.length > 0) {
    console.warn(`WARNING: ${sheetName} header mismatches:\n  ${mismatches.join('\n  ')}`)
  } else {
    console.log(`  ${sheetName} headers validated OK`)
  }
}

// Parse "Supports" column for SupportTask -> KeyResult linkage
function parseSupportsColumn(
  value: string | null | undefined,
  krMap: Map<string, string>,
  warnings: string[]
): string[] {
  if (!value) return []
  const trimmed = value.toString().trim()

  // Pattern 1: "All KRs" -> link to all 6 KRs
  if (trimmed.toLowerCase() === 'all krs') {
    return Array.from(krMap.values())
  }

  // Pattern 2: "Parent company" -> no KR links
  if (trimmed.toLowerCase() === 'parent company') {
    return [] // No KR linkage for parent company tasks
  }

  // Pattern 3: "KR1.1" or "KR1.1, KR1.3" -> parse comma-separated
  return trimmed.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(krId => {
      const id = krMap.get(krId)
      if (!id) warnings.push(`Support task: KR "${krId}" not found in lookup`)
      return id
    })
    .filter((id): id is string => id !== undefined)
}

// ============================================================
// Excel Column Mappings (Verified from v2 Excel)
// ============================================================

// KEY RESULTS sheet: Header at row index 2, data starts at row index 3
const KR_HEADER_ROW = 2
const KR_DATA_START = 3
const KR_EXPECTED_HEADERS = [
  'KR ID', 'Objective', 'Key Result Description', 'Metric Type',
  'Target', 'Actual', 'Unit', 'Progress %', 'Deadline',
  'Status', 'Owner', 'How We Measure', 'Notes'
]

// INITIATIVES sheet: Header at row index 2, data starts at row index 3
const INIT_HEADER_ROW = 2
const INIT_DATA_START = 3
const INIT_EXPECTED_HEADERS = [
  'ID', 'KR', 'Objective', 'Initiative', 'Department',
  'Start Date', 'End Date', 'Budget (RM)', 'Resources',
  'Person In Charge', 'Accountable', 'Status', 'Progress', 'Remarks'
]

// SUPPORT TASKS sheet: Header at row index 3, data starts at row index 4
const ST_HEADER_ROW = 3
const ST_DATA_START = 4
const ST_EXPECTED_HEADERS = [
  'ID', 'Category', 'Task', 'Supports', 'Owner',
  'Frequency', 'Priority', 'Notes'
]

// ============================================================
// Wipe OKR Data (Dependency-Safe)
// ============================================================

async function wipeOkrData(): Promise<void> {
  console.log('\nWiping OKR data...')

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;')
  try {
    // Join tables first
    const stKrCount = await prisma.supportTaskKeyResult.deleteMany()
    console.log(`  Deleted ${stKrCount.count} support task-KR links`)

    // Child records
    const stCount = await prisma.supportTask.deleteMany()
    console.log(`  Deleted ${stCount.count} support tasks`)

    // Comments on initiatives (cascade would handle this, but be explicit)
    const commentCount = await prisma.comment.deleteMany()
    console.log(`  Deleted ${commentCount.count} comments`)

    // Null out project initiative links (preserve projects!)
    const projectUpdate = await prisma.project.updateMany({
      where: { initiativeId: { not: null } },
      data: { initiativeId: null },
    })
    if (projectUpdate.count > 0) {
      console.log(`  Unlinked ${projectUpdate.count} projects from initiatives`)
    }

    // Now safe to delete initiatives
    const initCount = await prisma.initiative.deleteMany()
    console.log(`  Deleted ${initCount.count} initiatives`)

    // Finally delete key results
    const krCount = await prisma.keyResult.deleteMany()
    console.log(`  Deleted ${krCount.count} key results`)

    // Events to attend (separate from OKR but included in seed)
    const eventCount = await prisma.eventToAttend.deleteMany()
    console.log(`  Deleted ${eventCount.count} events to attend`)
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;')
  }
}

// ============================================================
// Seed Validation Summary
// ============================================================

async function printValidationSummary(warnings: string[]): Promise<void> {
  console.log('\n========================================')
  console.log('SEED VALIDATION SUMMARY')
  console.log('========================================')

  const krCount = await prisma.keyResult.count()
  const initCount = await prisma.initiative.count()
  const stCount = await prisma.supportTask.count()
  const joinCount = await prisma.supportTaskKeyResult.count()
  const eventCount = await prisma.eventToAttend.count()

  console.log(`KeyResults:              ${krCount} (expected: 6)`)
  console.log(`Initiatives:             ${initCount} (expected: 37)`)
  console.log(`SupportTasks:            ${stCount} (expected: 30)`)
  console.log(`SupportTask-KR links:    ${joinCount} (expected: 58)`)
  console.log(`EventsToAttend:          ${eventCount}`)

  // Verify FK linkages
  const unlinkedInit = await prisma.initiative.count({ where: { keyResultId: null } })
  if (unlinkedInit > 0) {
    console.log(`\nWARNING: ${unlinkedInit} initiatives have no KeyResult link!`)
  } else {
    console.log(`\nAll initiatives linked to KeyResults: OK`)
  }

  // Verify KR distribution
  const krGroups = await prisma.initiative.groupBy({
    by: ['keyResultId'],
    _count: true,
  })
  console.log(`\nInitiatives per KeyResult:`)
  for (const g of krGroups) {
    const kr = await prisma.keyResult.findUnique({ where: { id: g.keyResultId! }, select: { krId: true } })
    console.log(`  ${kr?.krId || 'UNKNOWN'}: ${g._count} initiatives`)
  }

  if (warnings.length > 0) {
    console.log(`\nPARSING WARNINGS (${warnings.length}):`)
    warnings.forEach(w => console.log(`  - ${w}`))
  } else {
    console.log(`\nNo parsing warnings.`)
  }

  console.log('========================================\n')
}

// ============================================================
// Main Seed Function
// ============================================================

async function main() {
  console.log('Starting v2.0 seed...')
  const warnings: string[] = []

  // =====================
  // Step 1: Read Both Excel Files
  // =====================
  const v2ExcelPath = path.join(__dirname, '../MotionVii_SAAP_2026_v2.xlsx')
  const v1ExcelPath = path.join(__dirname, '../MotionVii_SAAP_2026.xlsx')

  console.log(`Reading v2 Excel file: ${v2ExcelPath}`)
  const v2Workbook = XLSX.readFile(v2ExcelPath)

  let v1Workbook: XLSX.WorkBook | null = null
  try {
    console.log(`Reading v1 Excel file: ${v1ExcelPath}`)
    v1Workbook = XLSX.readFile(v1ExcelPath)
  } catch {
    console.log('v1 Excel file not found -- will skip Events to Attend')
  }

  // =====================
  // Step 2: Wipe OKR Data
  // =====================
  await wipeOkrData()

  // =====================
  // Step 3: Seed KeyResults (6 records)
  // =====================
  console.log('\n--- Seeding Key Results ---')
  const krSheet = v2Workbook.Sheets['Key Results']
  if (!krSheet) {
    throw new Error('Key Results sheet not found in v2 Excel file!')
  }
  const krData = XLSX.utils.sheet_to_json(krSheet, { header: 1 }) as any[][]

  // Validate headers
  validateHeaders(krData[KR_HEADER_ROW], KR_EXPECTED_HEADERS, 'Key Results')

  const krMap = new Map<string, string>() // "KR1.1" -> cuid
  let krCount = 0

  for (let i = KR_DATA_START; i < krData.length; i++) {
    const row = krData[i]
    if (!row || row.length === 0 || !row[0]) continue

    // Trim all strings for trailing \r\n (Pitfall 1)
    const krId = row[0]?.toString().trim()
    const objectiveStr = row[1]?.toString().trim() || ''
    const description = row[2]?.toString().trim() || ''
    const metricType = normalizeMetricType(row[3]?.toString().trim())
    const target = parseFloat(row[4]?.toString()) || 0
    const actual = parseFloat(row[5]?.toString()) || 0
    const unit = row[6]?.toString().trim() || ''
    const progress = parseProgress(row[7])
    const deadline = row[8]?.toString().trim() || ''
    const status = normalizeKeyResultStatus(row[9]?.toString().trim())
    const owner = row[10]?.toString().trim() || ''
    const howWeMeasure = row[11]?.toString().trim() || null
    const notes = row[12]?.toString().trim() || null

    try {
      const kr = await prisma.keyResult.create({
        data: {
          krId,
          objective: normalizeObjective(objectiveStr),
          description,
          metricType,
          target,
          actual,
          unit,
          progress,
          deadline,
          status,
          owner,
          howWeMeasure,
          notes,
        },
      })
      krMap.set(krId, kr.id)
      krCount++
      console.log(`  Created KR: ${krId} - ${description.substring(0, 60)}`)
    } catch (error) {
      console.error(`  Error creating KeyResult at row ${i + 1}:`, error)
      warnings.push(`Failed to create KeyResult at row ${i + 1}`)
    }
  }
  console.log(`KeyResults seeded: ${krCount}`)

  // =====================
  // Step 4: Seed Initiatives (37 records)
  // =====================
  console.log('\n--- Seeding Initiatives ---')
  const initSheet = v2Workbook.Sheets['Initiatives']
  if (!initSheet) {
    throw new Error('Initiatives sheet not found in v2 Excel file!')
  }
  const initData = XLSX.utils.sheet_to_json(initSheet, { header: 1 }) as any[][]

  // Validate headers
  validateHeaders(initData[INIT_HEADER_ROW], INIT_EXPECTED_HEADERS, 'Initiatives')

  let initCount = 0
  let position = 1

  for (let i = INIT_DATA_START; i < initData.length; i++) {
    const row = initData[i]
    if (!row || row.length === 0 || !row[3]) continue // Check for Initiative title column

    const idValue = row[0]?.toString().trim() || ''
    const krRef = row[1]?.toString().trim() || ''
    const objectiveStr = row[2]?.toString().trim() || ''
    const title = row[3]?.toString().trim() || ''
    const department = normalizeDepartment(row[4]?.toString().trim())
    const startDate = parseExcelDate(row[5])
    const endDate = parseExcelDate(row[6])
    const budget = row[7] != null ? String(row[7]) : null // Pitfall 3: numeric -> string
    const resources = row[8]?.toString().trim() || null
    const personInCharge = normalizeTeamMember(row[9]?.toString().trim())
    const accountable = normalizeTeamMember(row[10]?.toString().trim())
    const status = normalizeStatus(row[11]?.toString().trim())
    // row[12] is Progress -- not a field on Initiative model
    const remarks = row[13]?.toString().trim() || null

    // FK lookup: resolve KR reference to cuid
    const keyResultId = krMap.get(krRef)
    if (!keyResultId) {
      warnings.push(`Initiative #${idValue}: KR "${krRef}" not found in lookup`)
    }

    const sequenceNumber = parseInt(idValue) || position

    try {
      await prisma.initiative.create({
        data: {
          sequenceNumber,
          objective: normalizeObjective(objectiveStr),
          department,
          title,
          startDate,
          endDate,
          personInCharge,
          accountable,
          status,
          remarks,
          position,
          keyResultId: keyResultId || null,
          budget,
          resources,
        },
      })
      initCount++
      console.log(`  Created initiative #${sequenceNumber}: ${title.substring(0, 50)}`)
      position++
    } catch (error) {
      console.error(`  Error creating initiative at row ${i + 1}:`, error)
      warnings.push(`Failed to create initiative at row ${i + 1}`)
      position++
    }
  }
  console.log(`Initiatives seeded: ${initCount}`)

  // =====================
  // Step 5: Seed SupportTasks (30 records)
  // =====================
  console.log('\n--- Seeding Support Tasks ---')
  const stSheet = v2Workbook.Sheets['Support Tasks']
  if (!stSheet) {
    throw new Error('Support Tasks sheet not found in v2 Excel file!')
  }
  const stData = XLSX.utils.sheet_to_json(stSheet, { header: 1 }) as any[][]

  // Validate headers
  validateHeaders(stData[ST_HEADER_ROW], ST_EXPECTED_HEADERS, 'Support Tasks')

  // Store support task data for join table creation
  const supportTaskEntries: { dbId: string; supportsValue: string | null }[] = []
  let stCount = 0

  for (let i = ST_DATA_START; i < stData.length; i++) {
    const row = stData[i]
    if (!row || row.length === 0 || !row[2]) continue // Check for Task column

    const idValue = row[0]?.toString().trim() || ''
    const category = normalizeSupportTaskCategory(row[1]?.toString().trim())
    const task = row[2]?.toString().trim() || ''
    const supportsValue = row[3]?.toString().trim() || null
    const owner = row[4]?.toString().trim() || ''
    const frequency = row[5]?.toString().trim() || null
    const priority = normalizeTaskPriority(row[6]?.toString().trim())
    const notes = row[7]?.toString().trim() || null

    // Format taskId as "ST-001" (pad to 3 digits)
    const numericId = parseInt(idValue) || (stCount + 1)
    const taskId = `ST-${String(numericId).padStart(3, '0')}`

    try {
      const st = await prisma.supportTask.create({
        data: {
          taskId,
          category,
          task,
          owner,
          frequency,
          priority,
          notes,
        },
      })
      supportTaskEntries.push({ dbId: st.id, supportsValue })
      stCount++
      console.log(`  Created support task ${taskId}: ${task.substring(0, 50)}`)
    } catch (error) {
      console.error(`  Error creating support task at row ${i + 1}:`, error)
      warnings.push(`Failed to create support task at row ${i + 1}`)
    }
  }
  console.log(`SupportTasks seeded: ${stCount}`)

  // =====================
  // Step 6: Seed SupportTaskKeyResult Join Records
  // =====================
  console.log('\n--- Seeding Support Task-KR Links ---')
  let joinCount = 0

  for (const entry of supportTaskEntries) {
    const keyResultIds = parseSupportsColumn(entry.supportsValue, krMap, warnings)

    for (const keyResultId of keyResultIds) {
      try {
        await prisma.supportTaskKeyResult.create({
          data: {
            supportTaskId: entry.dbId,
            keyResultId,
          },
        })
        joinCount++
      } catch (error) {
        console.error(`  Error creating join entry for ST ${entry.dbId}:`, error)
        warnings.push(`Failed to create join entry for support task`)
      }
    }
  }
  console.log(`SupportTask-KR links seeded: ${joinCount}`)

  // =====================
  // Step 7: Seed EventsToAttend from Old v1 Excel File
  // =====================
  console.log('\n--- Importing Events to Attend ---')

  if (v1Workbook) {
    const eventsSheet = v1Workbook.Sheets['Events to Attend']
    if (eventsSheet) {
      const eventsData = XLSX.utils.sheet_to_json(eventsSheet, { header: 1 }) as any[][]

      let eventCount = 0
      // Data starts at row 4 (index 4), header is at row 3 (index 3)
      for (let i = 4; i < eventsData.length; i++) {
        const row = eventsData[i]

        // Skip empty rows or summary rows
        if (!row || row.length === 0 || !row[1]) continue
        if (row[0]?.toString().includes('BUDGET') || row[0]?.toString().includes('TOTAL')) break

        const eventToAttend = {
          priority: normalizeEventPriority(row[0]),
          name: row[1]?.toString() || '',
          category: normalizeEventCategory(row[2]),
          eventDate: row[3]?.toString() || '',
          location: row[4]?.toString() || '',
          estimatedCost: parseCost(row[5]),
          whyAttend: row[6]?.toString() || null,
          targetCompanies: row[7]?.toString() || null,
          actionRequired: row[8]?.toString() || null,
          status: normalizeEventStatus(row[9]),
        }

        try {
          await prisma.eventToAttend.create({ data: eventToAttend })
          console.log(`  Created event: ${eventToAttend.name.substring(0, 40)}`)
          eventCount++
        } catch (error) {
          console.error(`  Error creating event at row ${i + 1}:`, error)
          warnings.push(`Failed to create event at row ${i + 1}`)
        }
      }

      console.log(`Events seed completed! Created ${eventCount} events.`)

      // Events summary
      const eventsSummary = await prisma.eventToAttend.groupBy({
        by: ['priority'],
        _count: true,
      })
      console.log('\nEvents by priority:')
      eventsSummary.forEach(e => console.log(`  ${e.priority}: ${e._count}`))
    } else {
      console.log('Events to Attend sheet not found in v1 Excel file')
    }
  } else {
    console.log('v1 Excel file not available -- skipping Events to Attend')
  }

  // =====================
  // Step 8: Print Validation Summary
  // =====================
  await printValidationSummary(warnings)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
