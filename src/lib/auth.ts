import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface UserSession {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'EDITOR' | 'VIEWER'
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<UserSession | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.password) {
      return null
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as 'ADMIN' | 'MANAGER' | 'EDITOR' | 'VIEWER'
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Check if user can edit (ADMIN, MANAGER, or EDITOR)
export function canEdit(user: UserSession | null): boolean {
  if (!user) return false
  return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'EDITOR'
}

// Check if user is admin
export function isAdmin(user: UserSession | null): boolean {
  if (!user) return false
  return user.role === 'ADMIN'
}

