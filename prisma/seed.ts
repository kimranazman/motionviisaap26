import { PrismaClient, InitiativeStatus, Objective, InitiativeDepartment, TeamMember, EventPriority, EventCategory, EventStatus } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'

const prisma = new PrismaClient()

// Map Excel status values to enum
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

// Map Excel objective values to enum
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

// Map Excel department values to enum
function normalizeDepartment(department: string | null | undefined): InitiativeDepartment {
  if (!department) return InitiativeDepartment.BIZ_DEV
  const normalized = department.toString().toLowerCase().trim()
  const deptMap: Record<string, InitiativeDepartment> = {
    'biz dev': InitiativeDepartment.BIZ_DEV,
    'bizdev': InitiativeDepartment.BIZ_DEV,
    'business development': InitiativeDepartment.BIZ_DEV,
    'operations': InitiativeDepartment.OPERATIONS,
    'ops': InitiativeDepartment.OPERATIONS,
    'finance': InitiativeDepartment.FINANCE,
    'fin': InitiativeDepartment.FINANCE,
    'marketing': InitiativeDepartment.MARKETING,
    'mkt': InitiativeDepartment.MARKETING,
  }
  return deptMap[normalized] || InitiativeDepartment.BIZ_DEV
}

// Map Excel team member values to enum
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

// Map Excel priority values to enum
function normalizeEventPriority(priority: string | null | undefined): EventPriority {
  if (!priority) return EventPriority.TIER_3
  const normalized = priority.toString().toLowerCase().trim()
  if (normalized.includes('tier 1') || normalized === 'tier1') return EventPriority.TIER_1
  if (normalized.includes('tier 2') || normalized === 'tier2') return EventPriority.TIER_2
  if (normalized.includes('tier 3') || normalized === 'tier3') return EventPriority.TIER_3
  if (normalized.includes('energy')) return EventPriority.ENERGY
  return EventPriority.TIER_3
}

// Map Excel category values to enum
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

async function main() {
  console.log('Starting seed...')

  // Read Excel file
  const excelPath = path.join(__dirname, '../MotionVii_SAAP_2026.xlsx')
  console.log(`Reading Excel file: ${excelPath}`)

  const workbook = XLSX.readFile(excelPath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON (skip header row)
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

  console.log(`Found ${data.length} rows (including header)`)

  // Clear existing data
  await prisma.initiative.deleteMany()
  console.log('Cleared existing initiatives')

  // Process rows (data starts at row 7, after 6 header rows)
  // Row 6 (index 6) is the column header row
  let sequenceNumber = 1
  for (let i = 7; i < data.length; i++) {
    const row = data[i]

    // Skip empty rows - check for Initiative column (index 4)
    if (!row || row.length === 0 || !row[4]) continue

    // Column mapping based on actual Excel structure:
    // A(0): ID, B(1): Objective, C(2): Key Result, D(3): Department, E(4): Initiative
    // F(5): Monthly Objective, G(6): Weekly Tasks, H(7): Start Date, I(8): End Date
    // J(9): Resources Financial, K(10): Resources Non-Financial
    // L(11): Person In Charge, M(12): Accountable, N(13): Status, O(14): Remarks

    const initiative = {
      sequenceNumber,
      objective: normalizeObjective(row[1]),
      keyResult: row[2]?.toString() || `KR${sequenceNumber}`,
      department: normalizeDepartment(row[3]),
      title: row[4]?.toString() || '',
      monthlyObjective: row[5]?.toString() || null,
      weeklyTasks: row[6]?.toString() || null,
      startDate: parseExcelDate(row[7]),
      endDate: parseExcelDate(row[8]),
      resourcesFinancial: parseCost(row[9]),
      resourcesNonFinancial: row[10]?.toString() || null,
      personInCharge: normalizeTeamMember(row[11]),
      accountable: normalizeTeamMember(row[12]),
      status: normalizeStatus(row[13]),
      remarks: row[14]?.toString() || null,
      position: sequenceNumber,
    }

    try {
      await prisma.initiative.create({ data: initiative })
      console.log(`Created initiative #${sequenceNumber}: ${initiative.title.substring(0, 50)}...`)
      sequenceNumber++
    } catch (error) {
      console.error(`Error creating initiative at row ${i + 1}:`, error)
    }
  }

  console.log(`\nInitiatives seed completed! Created ${sequenceNumber - 1} initiatives.`)

  // =====================
  // IMPORT EVENTS TO ATTEND
  // =====================
  console.log('\n--- Importing Events to Attend ---')

  const eventsSheet = workbook.Sheets['Events to Attend']
  if (eventsSheet) {
    const eventsData = XLSX.utils.sheet_to_json(eventsSheet, { header: 1 }) as any[][]

    // Clear existing events
    await prisma.eventToAttend.deleteMany()
    console.log('Cleared existing events to attend')

    let eventCount = 0
    // Data starts at row 4 (index 4), header is at row 3 (index 3)
    // Columns: Priority, Event Name, Category, Date, Location, Est. Cost, Why Attend, Target Companies, Action Required, Status
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
        console.log(`Created event: ${eventToAttend.name.substring(0, 40)}...`)
        eventCount++
      } catch (error) {
        console.error(`Error creating event at row ${i + 1}:`, error)
      }
    }

    console.log(`\nEvents seed completed! Created ${eventCount} events.`)

    // Events summary
    const eventsSummary = await prisma.eventToAttend.groupBy({
      by: ['priority'],
      _count: true,
    })
    console.log('\nEvents by priority:')
    eventsSummary.forEach(e => console.log(`  ${e.priority}: ${e._count}`))
  } else {
    console.log('Events to Attend sheet not found')
  }

  // =====================
  // SHOW INITIATIVES SUMMARY
  // =====================
  console.log('\n--- Initiatives Summary ---')
  const summary = await prisma.initiative.groupBy({
    by: ['status'],
    _count: true,
  })
  console.log('\nStatus summary:')
  summary.forEach(s => console.log(`  ${s.status}: ${s._count}`))

  const deptSummary = await prisma.initiative.groupBy({
    by: ['department'],
    _count: true,
  })
  console.log('\nDepartment summary:')
  deptSummary.forEach(d => console.log(`  ${d.department}: ${d._count}`))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
