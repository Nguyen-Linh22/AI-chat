import { Request, Response } from 'express'
import { AI_MODELS } from '../ai/model.registry.js'

export const getAIModels = (
  _req: Request,
  res: Response
) => {
  return res.status(200).json({
    models: AI_MODELS
  })
}