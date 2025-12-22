import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all data from database...')

  // Clear all data in correct order (due to foreign key constraints)
  await prisma.transaction.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ All data cleared successfully!')
  console.log('📊 Database is now empty and ready for manual data entry.')
}

main()
  .catch((e) => {
    console.error('❌ Error during data clearing:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
