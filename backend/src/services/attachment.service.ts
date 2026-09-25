import fs from 'fs'

import { prisma } from '../lib/prisma.js'
import { safeDeleteFile } from '../utils/file.util.js'
import { uploadFileToCloudinary, deleteFileFromCloudinary } from './cloudinary.service.js'
import { extractFileText, isExtractableMimeType } from './file-extraction.service.js'

export const createAttachment = async (
  messageId: string,
  userId: string,
  file: Express.Multer.File
) => {
  let uploadedPublicId: string | undefined
  let uploadedResourceType: string = 'image'
  let isSavedInDb = false

  try {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        session: {
          userId
        }
      }
    })

    if (!message) {
      return null
    }

    let extractedText: string | null = null

    if (isExtractableMimeType(file.mimetype)) {
      extractedText = await extractFileText(
        file.path,
        file.mimetype
      )
    }

    const cloudinaryResult = await uploadFileToCloudinary(
      file.path,
      file.originalname
    )
    uploadedPublicId = cloudinaryResult.public_id
    uploadedResourceType = cloudinaryResult.resource_type || 'image'

    const attachment = await prisma.attachment.create({
      data: {
        messageId,
        fileName: file.originalname,
        fileUrl: cloudinaryResult.secure_url,
        fileType: file.mimetype,
        sizeBytes: BigInt(file.size),
        extractedText
      }
    })

    isSavedInDb = true
    return attachment
  } catch (error) {
    if (uploadedPublicId && !isSavedInDb) {
      await deleteFileFromCloudinary(uploadedPublicId, uploadedResourceType)
    }
    throw error
  } finally {
    safeDeleteFile(file.path)
  }
}