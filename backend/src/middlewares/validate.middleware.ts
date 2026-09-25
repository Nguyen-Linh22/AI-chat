import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { safeDeleteFile } from '../utils/file.util.js'

export type ValidationTarget = 'body' | 'params' | 'query'

export const validate = (
  schema: z.ZodType,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[target]
    const result = schema.safeParse(dataToValidate)

    if (!result.success) {
      safeDeleteFile(req.file?.path)

      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      })
    }

    if (target === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true
      })
    } else {
      ;(req as any)[target] = result.data
    }

    next()
  }
}