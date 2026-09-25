import fs from 'fs/promises'
import { PDFParse } from 'pdf-parse'

export const SUPPORTED_EXTRACTION_MIMES = [
  'application/pdf',
  'text/plain'
] as const

export const MAX_EXTRACTED_TEXT_CHARS = 50_000 // 50.000 ký tự tối đa cho 1 file

export class FileExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileExtractionError'
  }
}

export const isExtractableMimeType = (mimeType: string): boolean => {
  return (SUPPORTED_EXTRACTION_MIMES as readonly string[]).includes(mimeType)
}

const limitExtractedText = (text: string): string => {
  if (text.length > MAX_EXTRACTED_TEXT_CHARS) {
    return (
      text.slice(0, MAX_EXTRACTED_TEXT_CHARS) +
      '\n\n[...Nội dung đã được cắt bớt do vượt quá giới hạn 50.000 ký tự...]'
    )
  }
  return text
}

export const extractFileText = async (
  filePath: string,
  mimeType: string
): Promise<string> => {
  if (!isExtractableMimeType(mimeType)) {
    throw new FileExtractionError(
      `Không hỗ trợ trích xuất văn bản từ loại file: ${mimeType}`
    )
  }

  if (mimeType === 'text/plain') {
    try {
      const rawText = await fs.readFile(filePath, 'utf-8')
      return limitExtractedText(rawText)
    } catch (error) {
      console.error('Lỗi khi đọc file TXT:', error)
      throw new FileExtractionError(
        'Không thể đọc nội dung file văn bản (file có thể bị lỗi mã hóa UTF-8 hoặc bị hỏng)'
      )
    }
  }

  if (mimeType === 'application/pdf') {
    let fileBuffer: Buffer
    try {
      fileBuffer = await fs.readFile(filePath)
    } catch (error) {
      console.error('Lỗi khi đọc file buffer PDF:', error)
      throw new FileExtractionError('Không thể đọc dữ liệu file PDF từ hệ thống')
    }

    const parser = new PDFParse({
      data: fileBuffer
    })

    try {
      const result = await parser.getText()
      return limitExtractedText(result.text)
    } catch (error) {
      console.error('Lỗi khi parse file PDF:', error)
      throw new FileExtractionError(
        'Không thể đọc nội dung file PDF (file có thể bị hỏng, lỗi cấu trúc hoặc có mật khẩu bảo vệ)'
      )
    } finally {
      try {
        await parser.destroy()
      } catch (destroyError) {
        console.error('Lỗi khi giải phóng PDF parser:', destroyError)
      }
    }
  }

  throw new FileExtractionError(
    `Không thể trích xuất nội dung từ loại file: ${mimeType}`
  )
}