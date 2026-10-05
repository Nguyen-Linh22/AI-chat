import { Request, Response } from 'express'
import { getHealthStatus } from '../services/health.service.js'

export const healthCheck = async (_req: Request, res: Response) => {
  const healthStatus = await getHealthStatus()
  const statusCode = healthStatus.status === 'ok' ? 200 : 503

  return res.status(statusCode).json(healthStatus)
}