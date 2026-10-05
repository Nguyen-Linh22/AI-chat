import { Request, Response } from 'express'
import { getVisibleAIModels } from '../ai/model.registry.js'

export const getAIModels = (
  _req: Request,
  res: Response
) => {
  return res.status(200).json({
    models: getVisibleAIModels()
  })
}
