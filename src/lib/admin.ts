import { NextRequest } from 'next/server'

export const isAdmin = (request: NextRequest): boolean => {
  // Server IP'sini al
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('x-client-ip') ||
                   '127.0.0.1'
  
  // Admin IP'leri (sadece server IP)
  // Production'da tüm IP'lere admin erişimi (geçici - güvenlik için daha sonra kısıtlanmalı)
  const adminIPs = process.env.NODE_ENV === 'production' 
    ? ['*'] // Production'da tüm IP'ler
    : [
        '10.0.0.140',  // Server IP
        '127.0.0.1',   // Localhost
        '::1'          // IPv6 localhost
      ]
  
  // IP kontrolü
  const isAdminIP = adminIPs.includes('*') || adminIPs.includes(clientIP)
  
  console.log('Admin check:', { clientIP, isAdminIP })
  
  return isAdminIP
}

export const requireAdmin = (request: NextRequest) => {
  if (!isAdmin(request)) {
    const error = new Error('Unauthorized: Admin access required')
    error.name = 'AdminRequired'
    throw error
  }
}

export const handleAdminError = (error: unknown) => {
  if (error instanceof Error && error.name === 'AdminRequired') {
    return {
      status: 403,
      message: 'Access denied. Only admin users can perform this action.'
    }
  }
  return null
}
