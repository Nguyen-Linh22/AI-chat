import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import { MAX_FILE_SIZE_BYTES } from '../middlewares/upload.middleware.js'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg'
]

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg'
]

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg']
}

const EXTENSION_TO_MIME: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg']
}

import { safeDeleteFile } from '../utils/file.util.js'

const deleteUploadedFile = safeDeleteFile

/**
 * Kiểm tra file signature (magic bytes) để đảm bảo nội dung file thực tế
 * khớp với MIME type được khai báo, phòng chống đổi đuôi file giả mạo.
 */
const verifyFileSignature = (filePath: string, mimetype: string): boolean => {
  let fd: number | null = null

  try {
    const buffer = Buffer.alloc(4096)
    fd = fs.openSync(filePath, 'r')
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0)
    const slice = buffer.subarray(0, bytesRead)

    if (mimetype === 'application/pdf') {
      // PDF bắt đầu bằng %PDF (0x25, 0x50, 0x44, 0x46)
      return (
        slice.length >= 4 &&
        slice[0] === 0x25 &&
        slice[1] === 0x50 &&
        slice[2] === 0x44 &&
        slice[3] === 0x46
      )
    }

    if (mimetype === 'image/png') {
      // PNG bắt đầu bằng 89 50 4E 47 0D 0A 1A 0A
      return (
        slice.length >= 8 &&
        slice[0] === 0x89 &&
        slice[1] === 0x50 &&
        slice[2] === 0x4e &&
        slice[3] === 0x47 &&
        slice[4] === 0x0d &&
        slice[5] === 0x0a &&
        slice[6] === 0x1a &&
        slice[7] === 0x0a
      )
    }

    if (mimetype === 'image/jpeg') {
      // JPEG bắt đầu bằng FF D8 FF
      return (
        slice.length >= 3 &&
        slice[0] === 0xff &&
        slice[1] === 0xd8 &&
        slice[2] === 0xff
      )
    }

    if (mimetype === 'text/plain') {
      // Plain text không có magic bytes cố định nhưng:
      // 1. Không chứa null byte (0x00) của file nhị phân
      if (slice.includes(0x00)) {
        return false
      }

      // 2. Không được bắt đầu bằng signature thực thi/nén phổ biến (MZ cho PE/EXE, 7F ELF, PK cho Zip/Docx)
      if (slice.length >= 2 && slice[0] === 0x4d && slice[1] === 0x5a) {
        return false
      }

      if (
        slice.length >= 4 &&
        slice[0] === 0x7f &&
        slice[1] === 0x45 &&
        slice[2] === 0x4c &&
        slice[3] === 0x46
      ) {
        return false
      }

      if (
        slice.length >= 4 &&
        slice[0] === 0x50 &&
        slice[1] === 0x4b &&
        slice[2] === 0x03 &&
        slice[3] === 0x04
      ) {
        return false
      }

      return true
    }

    return false
  } catch (error) {
    console.error('Lỗi khi đọc file signature:', error)
    return false
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd)
      } catch {}
    }
  }
}

export const validateUploadedFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Kiểm tra file tồn tại
  if (!req.file) {
    return next()
  }

  // 2. Kiểm tra size hợp lệ
  if (req.file.size === 0) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'File không được rỗng'
    })
  }

  if (req.file.size > MAX_FILE_SIZE_BYTES) {
    deleteUploadedFile(req.file.path)

    return res.status(413).json({
      message: 'File không được vượt quá 10 MB'
    })
  }

  // 3. Kiểm tra filename hợp lệ
  const originalname = req.file.originalname

  if (!originalname || !originalname.trim()) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Tên file không hợp lệ'
    })
  }

  if (originalname.length > 255) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Tên file không được vượt quá 255 ký tự'
    })
  }

  // Kiểm tra chống Path Traversal (chặn .., /, \, \0)
  if (
    originalname.includes('..') ||
    originalname.includes('/') ||
    originalname.includes('\\') ||
    originalname.includes('\0') ||
    path.basename(originalname) !== originalname
  ) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Tên file không hợp lệ (phát hiện ký tự đường dẫn không an toàn)'
    })
  }

  // 4. Validate extension (chuyển về lowercase)
  const ext = path.extname(originalname).toLowerCase()

  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Phần mở rộng file không được hỗ trợ',
      extension: ext
    })
  }

  // 5. Kiểm tra MIME hợp lệ (Allowlist)
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    deleteUploadedFile(req.file.path)

    return res.status(415).json({
      message: 'Loại file không được hỗ trợ',
      mimetype: req.file.mimetype
    })
  }

  // 6. Đồng bộ Extension ↔ MIME khớp 2 chiều
  const allowedExts = MIME_TO_EXTENSIONS[req.file.mimetype]
  const allowedMimes = EXTENSION_TO_MIME[ext]

  if (!allowedExts?.includes(ext) || !allowedMimes?.includes(req.file.mimetype)) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Phần mở rộng file không khớp với định dạng MIME',
      extension: ext,
      mimetype: req.file.mimetype
    })
  }

  // 7. Kiểm tra file signature (magic bytes)
  const isValidSignature = verifyFileSignature(
    req.file.path,
    req.file.mimetype
  )

  if (!isValidSignature) {
    deleteUploadedFile(req.file.path)

    return res.status(400).json({
      message: 'Nội dung file không hợp lệ hoặc không khớp với định dạng khai báo'
    })
  }

  // 8. Cho phép xử lý tiếp
  next()
}