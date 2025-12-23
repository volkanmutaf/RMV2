import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating admin user...')

  const username = 'admin'
  const password = 'admin123' // Change this!
  const name = 'Administrator'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username }
  })

  if (existingAdmin) {
    console.log('Admin user already exists!')
    return
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
      role: 'ADMIN'
    }
  })

  console.log('✅ Admin user created successfully!')
  console.log(`Username: ${username}`)
  console.log(`Password: ${password}`)
  console.log('⚠️  Please change the password after first login!')
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

