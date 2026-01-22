import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Labor', description: 'Internal staff costs', sortOrder: 1 },
  { name: 'Materials', description: 'Physical materials and supplies', sortOrder: 2 },
  { name: 'Vendors', description: 'Third-party contractor/vendor costs', sortOrder: 3 },
  { name: 'Travel', description: 'Transportation and accommodation', sortOrder: 4 },
  { name: 'Software', description: 'Software licenses and subscriptions', sortOrder: 5 },
  { name: 'Other', description: 'Miscellaneous costs', sortOrder: 6 },
]

async function main() {
  console.log('Seeding cost categories...')

  for (const category of categories) {
    const result = await prisma.costCategory.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        sortOrder: category.sortOrder,
      },
      create: category,
    })
    console.log(`  ✓ ${result.name}`)
  }

  const count = await prisma.costCategory.count()
  console.log(`\nTotal cost categories: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
