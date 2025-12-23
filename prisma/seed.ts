import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.transaction.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        name: 'System Administrator',
        role: 'ADMIN'
      }
    }),
    prisma.user.create({
      data: {
        username: 'manager',
        password: await bcrypt.hash('manager123', 10),
        name: 'Operations Manager',
        role: 'ADMIN'
      }
    }),
    prisma.user.create({
      data: {
        username: 'staff',
        password: await bcrypt.hash('staff123', 10),
        name: 'Registration Staff',
        role: 'VIEWER'
      }
    })
  ])

  // Create customers
  console.log('👤 Creating customers...')
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'John Smith', contact: '555-0101' } }),
    prisma.customer.create({ data: { name: 'Sarah Johnson', contact: '555-0102' } }),
    prisma.customer.create({ data: { name: 'Michael Brown', contact: '555-0103' } }),
    prisma.customer.create({ data: { name: 'Emily Davis', contact: '555-0104' } }),
    prisma.customer.create({ data: { name: 'Robert Wilson', contact: '555-0105' } }),
    prisma.customer.create({ data: { name: 'Lisa Anderson', contact: '555-0106' } }),
    prisma.customer.create({ data: { name: 'David Taylor', contact: '555-0107' } }),
    prisma.customer.create({ data: { name: 'Jennifer Martinez', contact: '555-0108' } }),
    prisma.customer.create({ data: { name: 'Christopher Lee', contact: '555-0109' } }),
    prisma.customer.create({ data: { name: 'Amanda Garcia', contact: '555-0110' } }),
    prisma.customer.create({ data: { name: 'James Rodriguez', contact: '555-0111' } }),
    prisma.customer.create({ data: { name: 'Michelle White', contact: '555-0112' } }),
    prisma.customer.create({ data: { name: 'Daniel Thompson', contact: '555-0113' } }),
    prisma.customer.create({ data: { name: 'Ashley Jackson', contact: '555-0114' } }),
    prisma.customer.create({ data: { name: 'Matthew Harris', contact: '555-0115' } }),
    prisma.customer.create({ data: { name: 'Jessica Clark', contact: '555-0116' } }),
    prisma.customer.create({ data: { name: 'Andrew Lewis', contact: '555-0117' } }),
    prisma.customer.create({ data: { name: 'Stephanie Walker', contact: '555-0118' } }),
    prisma.customer.create({ data: { name: 'Kevin Hall', contact: '555-0119' } }),
    prisma.customer.create({ data: { name: 'Nicole Allen', contact: '555-0120' } })
  ])

  // Create vehicles
  console.log('🚗 Creating vehicles...')
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { year: '2020', make: 'Toyota', model: 'Camry', vin: '1HGBH41JXMN109186' } }),
    prisma.vehicle.create({ data: { year: '2019', make: 'Honda', model: 'Civic', vin: '2HGBH41JXMN109187' } }),
    prisma.vehicle.create({ data: { year: '2021', make: 'Ford', model: 'F-150', vin: '3HGBH41JXMN109188' } }),
    prisma.vehicle.create({ data: { year: '2018', make: 'Chevrolet', model: 'Silverado', vin: '4HGBH41JXMN109189' } }),
    prisma.vehicle.create({ data: { year: '2022', make: 'Nissan', model: 'Altima', vin: '5HGBH41JXMN109190' } }),
    prisma.vehicle.create({ data: { year: '2020', make: 'BMW', model: 'X5', vin: '6HGBH41JXMN109191' } }),
    prisma.vehicle.create({ data: { year: '2019', make: 'Mercedes-Benz', model: 'C-Class', vin: '7HGBH41JXMN109192' } }),
    prisma.vehicle.create({ data: { year: '2021', make: 'Audi', model: 'A4', vin: '8HGBH41JXMN109193' } }),
    prisma.vehicle.create({ data: { year: '2017', make: 'Lexus', model: 'RX', vin: '9HGBH41JXMN109194' } }),
    prisma.vehicle.create({ data: { year: '2020', make: 'Acura', model: 'MDX', vin: '0HGBH41JXMN109195' } }),
    prisma.vehicle.create({ data: { year: '2019', make: 'Infiniti', model: 'Q50', vin: '1HGBH41JXMN109196' } }),
    prisma.vehicle.create({ data: { year: '2021', make: 'Cadillac', model: 'Escalade', vin: '2HGBH41JXMN109197' } }),
    prisma.vehicle.create({ data: { year: '2018', make: 'Lincoln', model: 'Navigator', vin: '3HGBH41JXMN109198' } }),
    prisma.vehicle.create({ data: { year: '2022', make: 'Tesla', model: 'Model 3', vin: '4HGBH41JXMN109199' } }),
    prisma.vehicle.create({ data: { year: '2020', make: 'Subaru', model: 'Outback', vin: '5HGBH41JXMN109200' } }),
    prisma.vehicle.create({ data: { year: '2019', make: 'Mazda', model: 'CX-5', vin: '6HGBH41JXMN109201' } }),
    prisma.vehicle.create({ data: { year: '2021', make: 'Hyundai', model: 'Elantra', vin: '7HGBH41JXMN109202' } }),
    prisma.vehicle.create({ data: { year: '2018', make: 'Kia', model: 'Sorento', vin: '8HGBH41JXMN109203' } }),
    prisma.vehicle.create({ data: { year: '2020', make: 'Volkswagen', model: 'Jetta', vin: '9HGBH41JXMN109204' } }),
    prisma.vehicle.create({ data: { year: '2019', make: 'Volvo', model: 'XC90', vin: '0HGBH41JXMN109205' } }),
    prisma.vehicle.create({ data: { year: '2021', make: 'Jeep', model: 'Wrangler', vin: '1HGBH41JXMN109206' } }),
    prisma.vehicle.create({ data: { year: '2020', make: 'Ram', model: '1500', vin: '2HGBH41JXMN109207' } }),
    prisma.vehicle.create({ data: { year: '2019', make: 'GMC', model: 'Sierra', vin: '3HGBH41JXMN109208' } }),
    prisma.vehicle.create({ data: { year: '2022', make: 'Porsche', model: 'Cayenne', vin: '4HGBH41JXMN109209' } }),
    prisma.vehicle.create({ data: { year: '2018', make: 'Jaguar', model: 'F-PACE', vin: '5HGBH41JXMN109210' } })
  ])

  // Create transactions with realistic data
  console.log('📋 Creating transactions...')
  const transactions = [
    // Recent transactions (last 30 days)
    { vehicle: 0, customer: 0, date: '2024-01-15', status: 'REGISTERED', plate: 'ABC-123', note: 'Completed registration process', ref: 'REF-2024-001' },
    { vehicle: 1, customer: 1, date: '2024-01-16', status: 'PICKED_UP', plate: 'DEF-456', note: 'Customer picked up documents', ref: 'REF-2024-002' },
    { vehicle: 2, customer: 2, date: '2024-01-17', status: 'INSPECTED', plate: 'GHI-789', note: 'Vehicle inspection completed', ref: 'REF-2024-003' },
    { vehicle: 3, customer: 3, date: '2024-01-18', status: 'TRANSFER_PLATE', plate: 'JKL-012', note: 'Plate transfer in progress', ref: 'REF-2024-004' },
    { vehicle: 4, customer: 4, date: '2024-01-19', status: 'RE_INSPECTION', plate: 'MNO-345', note: 'Processing', ref: 'REF-2024-005' },
    
    // Mid-term transactions (30-60 days ago)
    { vehicle: 5, customer: 5, date: '2023-12-20', status: 'REGISTERED', plate: 'PQR-678', note: 'Luxury vehicle registration', ref: 'REF-2023-120' },
    { vehicle: 6, customer: 6, date: '2023-12-22', status: 'RE_INSPECTION', plate: 'STU-901', note: 'Processing', ref: 'REF-2023-122' },
    { vehicle: 7, customer: 7, date: '2023-12-25', status: 'READY_FOR_PICKUP', plate: 'VWX-234', note: 'Ready for customer pickup', ref: 'REF-2023-125' },
    { vehicle: 8, customer: 8, date: '2023-12-28', status: 'RE_INSPECTION', plate: 'YZA-567', note: 'Requires re-inspection', ref: 'REF-2023-128' },
    { vehicle: 9, customer: 9, date: '2023-12-30', status: 'INSPECTED', plate: 'BCD-890', note: 'Inspection passed', ref: 'REF-2023-130' },
    
    // Older transactions (60+ days ago)
    { vehicle: 10, customer: 10, date: '2023-11-15', status: 'REGISTERED', plate: 'EFG-123', note: 'Completed registration', ref: 'REF-2023-110' },
    { vehicle: 11, customer: 11, date: '2023-11-18', status: 'REGISTERED', plate: 'HIJ-456', note: 'Luxury SUV registration', ref: 'REF-2023-113' },
    { vehicle: 12, customer: 12, date: '2023-11-22', status: 'PICKED_UP', plate: 'KLM-789', note: 'Customer picked up', ref: 'REF-2023-117' },
    { vehicle: 13, customer: 13, date: '2023-11-25', status: 'REGISTERED', plate: 'NOP-012', note: 'Electric vehicle registration', ref: 'REF-2023-120' },
    { vehicle: 14, customer: 14, date: '2023-11-28', status: 'INSPECTED', plate: 'QRS-345', note: 'Inspection completed', ref: 'REF-2023-123' },
    
    // Various status scenarios
    { vehicle: 15, customer: 15, date: '2024-01-10', status: 'TRANSFER_PLATE', plate: 'TUV-678', note: 'Plate transfer initiated', ref: 'REF-2024-010' },
    { vehicle: 16, customer: 16, date: '2024-01-12', status: 'RE_INSPECTION', plate: 'WXY-901', note: 'Processing', ref: 'REF-2024-012' },
    { vehicle: 17, customer: 17, date: '2024-01-14', status: 'RE_INSPECTION', plate: 'ZAB-234', note: 'Processing', ref: 'REF-2024-014' },
    { vehicle: 18, customer: 18, date: '2024-01-16', status: 'RE_INSPECTION', plate: 'CDE-567', note: 'Failed inspection, needs re-inspection', ref: 'REF-2024-016' },
    { vehicle: 19, customer: 19, date: '2024-01-18', status: 'READY_FOR_PICKUP', plate: 'FGH-890', note: 'All documents ready', ref: 'REF-2024-018' },
    
    // No status transactions (for testing "No Status" filter)
    { vehicle: 20, customer: 0, date: '2024-01-20', status: null, plate: null, note: 'New transaction, no status yet', ref: 'REF-2024-020' },
    { vehicle: 21, customer: 1, date: '2024-01-21', status: null, plate: null, note: 'Payment received, status pending', ref: 'REF-2024-021' },
    { vehicle: 22, customer: 2, date: '2024-01-22', status: null, plate: null, note: 'Awaiting initial processing', ref: 'REF-2024-022' },
    
    // High-value transactions
    { vehicle: 23, customer: 3, date: '2024-01-23', status: 'INSPECTED', plate: 'IJK-123', note: 'Luxury vehicle inspection', ref: 'REF-2024-023' },
    { vehicle: 24, customer: 4, date: '2024-01-24', status: 'TRANSFER_PLATE', plate: 'LMN-456', note: 'High-value plate transfer', ref: 'REF-2024-024' }
  ]

  await Promise.all(
    transactions.map(transaction => 
      prisma.transaction.create({
        data: {
          vehicleId: vehicles[transaction.vehicle].id,
          customerId: customers[transaction.customer].id,
          date: new Date(transaction.date),
          status: transaction.status as any,
          plate: transaction.plate,
          note: transaction.note,
          ref: transaction.ref
        }
      })
    )
  )

  console.log('✅ Database seeding completed successfully!')
  console.log(`📊 Summary:`)
  console.log(`   👥 Users: ${users.length}`)
  console.log(`   👤 Customers: ${customers.length}`)
  console.log(`   🚗 Vehicles: ${vehicles.length}`)
  console.log(`   📋 Transactions: ${transactions.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })