import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'khairul@talenta.com.my'

async function main() {
  console.log('Seeding admin user...')

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: UserRole.ADMIN, // Ensure admin role even if exists
    },
    create: {
      email: ADMIN_EMAIL,
      name: 'Khairul',
      role: UserRole.ADMIN,
    },
  })

  console.log(`Admin user ready: ${admin.email} (role: ${admin.role})`)
}

main()
  .catch((e) => {
    console.error('Admin seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
