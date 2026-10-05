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

export interface CleanupResult {
  cleanedCount: number
  errorCount: number
}

/**
 * Dọn dẹp các file rác trong thư mục uploads tạm thời.
 * Chỉ xử lý các file có thời gian chỉnh sửa (mtime) cũ hơn khoảng thời gian an toàn maxAgeMs (mặc định: 1 giờ),
 * tránh vô tình xóa các file đang được upload trong lúc server khởi động lại.
 * An toàn: Không đụng Cloudinary, không đụng database, không xóa thư mục gốc.
 */
export const cleanupTempUploads = (
  dirPath: string = getUploadDir(),
  maxAgeMs: number = 60 * 60 * 1000 // 1 giờ
): CleanupResult => {
  const result: CleanupResult = {
    cleanedCount: 0,
    errorCount: 0
  }

  try {
    ensureUploadDir(dirPath)
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const now = Date.now()

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue
      }

      const filePath = path.join(dirPath, entry.name)
      try {
        const stats = fs.statSync(filePath)
        const fileAgeMs = now - stats.mtimeMs

        if (fileAgeMs >= maxAgeMs) {
          fs.unlinkSync(filePath)
          result.cleanedCount++
        }
      } catch (fileErr) {
        console.warn(`[UPLOAD_CLEANUP] Không thể dọn file tạm "${filePath}":`, fileErr)
        result.errorCount++
      }
    }
  } catch (dirErr) {
    console.warn(`[UPLOAD_CLEANUP] Không thể đọc thư mục uploads "${dirPath}":`, dirErr)
    result.errorCount++
  }

  return result
}
