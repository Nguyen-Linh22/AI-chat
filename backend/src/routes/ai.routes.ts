import { Router } from 'express'
import { getAIModels } from '../controllers/ai.controller.js'

const router = Router()

router.get('/models', getAIModels)

export default router