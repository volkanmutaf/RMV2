import { prisma } from '@/lib/prisma'
import VehicleTable from '@/components/VehicleTable'
import { Transaction, Vehicle, Customer } from '@/generated/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { UserSession } from '@/lib/auth'

interface TransactionWithRelations extends Transaction {
  vehicle: Vehicle
  customer: Customer
}

export const dynamic = 'force-dynamic'

async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')
    if (!sessionCookie) return null
    return JSON.parse(sessionCookie.value) as UserSession
  } catch {
    return null
  }
}

export default async function Home() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  // Get all transactions with vehicle and customer information
  let transactions: TransactionWithRelations[] = []
  
  try {
    const allTransactions = await prisma.transaction.findMany({
      include: {
        vehicle: true,
        customer: true,
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    // Filter out archived transactions (only show where archived is false or null/undefined)
    transactions = allTransactions.filter(t => t.archived !== true)
    
    console.log('Page - All transactions:', allTransactions.length)
    console.log('Page - Non-archived transactions:', transactions.length)
    if (allTransactions.length > 0) {
      console.log('Page - First transaction archived:', allTransactions[0].archived)
    }
  } catch (error) {
    console.error('Database connection error:', error)
    // Return empty array if database is not available
    transactions = []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6">
        <VehicleTable transactions={transactions} currentUser={user} />
      </div>
    </div>
  )
}
