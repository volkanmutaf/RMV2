import { prisma } from '@/lib/prisma'
import VehicleTable from '@/components/VehicleTable'

export default async function Home() {
  // Get all transactions with vehicle and customer information
  const transactions = await prisma.transaction.findMany({
    include: {
      vehicle: true,
      customer: true,
    },
    orderBy: {
      date: 'desc'
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6">
        <VehicleTable transactions={transactions} />
      </div>
    </div>
  )
}
