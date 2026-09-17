import { Request, Response } from 'express'
import { getHealthStatus } from '../services/health.service.js'

export const healthCheck = (_req: Request, res: Response) => {
  const healthStatus = getHealthStatus()

  res.json(healthStatus)
}