import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const adminStatus = isAdmin(request)
    
    return NextResponse.json({ 
      isAdmin: adminStatus,
      clientIP: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                request.headers.get('x-client-ip') ||
                '127.0.0.1'
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
