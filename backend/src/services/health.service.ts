import { prisma } from '../lib/prisma.js'

export interface HealthStatus {
  status: 'ok' | 'error'
  message: string
}

export const getHealthStatus = async (): Promise<HealthStatus> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      status: 'ok',
      message: 'Backend is healthy'
    }
  } catch (error) {
    console.error('Health check DB error:', error)
    return {
      status: 'error',
      message: 'Database connection failed'
    }
  }
}