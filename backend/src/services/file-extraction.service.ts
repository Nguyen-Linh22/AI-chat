import fs from 'fs/promises'
import { PDFParse } from 'pdf-parse'

export const extractFileText = async (
  filePath: string,
  mimeType: string
): Promise<string> => {
  if (mimeType === 'text/plain') {
    return fs.readFile(filePath, 'utf-8')
  }

  if (mimeType === 'application/pdf') {
    const fileBuffer = await fs.readFile(filePath)

    const parser = new PDFParse({
      data: fileBuffer
    })

    const result = await parser.getText()

    await parser.destroy()

    return result.text
  }

  throw new Error(
    `Không thể trích xuất nội dung từ loại file: ${mimeType}`
  )
}