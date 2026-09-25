import fs from 'fs'

/**
 * Xóa file tạm an toàn từ đường dẫn vật lý (filePath).
 * Không gây crash nếu file không tồn tại hoặc có lỗi truy cập.
 */
export const safeDeleteFile = (filePath?: string): void => {
  if (!filePath) return

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Không thể xóa file tạm:', error)
  }
}
