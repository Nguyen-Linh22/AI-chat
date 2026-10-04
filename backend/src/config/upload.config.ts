import path from 'path'
import fs from 'fs'

/**
 * Returns the absolute path to the temporary uploads directory.
 * Works consistently in local development, monorepo root execution,
 * and production on Render.
 */
export const getUploadDir = (): string => {
  const cwd = process.cwd()
  if (fs.existsSync(path.join(cwd, 'backend')) && !cwd.endsWith('backend')) {
    return path.join(cwd, 'backend', 'uploads')
  }
  return path.join(cwd, 'uploads')
}

export const UPLOAD_DIR = getUploadDir()

/**
 * Ensures the temporary upload directory exists synchronously.
 * Idempotent: safe to invoke repeatedly and concurrently across requests or server boot.
 */
export const ensureUploadDir = (dirPath: string = getUploadDir()): string => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  return dirPath
}
