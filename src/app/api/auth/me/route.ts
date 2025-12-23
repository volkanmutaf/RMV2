import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { UserSession } from '@/lib/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    const user: UserSession = JSON.parse(sessionCookie.value)

    return NextResponse.json({ 
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}

