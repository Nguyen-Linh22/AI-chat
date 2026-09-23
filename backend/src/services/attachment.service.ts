import fs from 'fs'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../generated/prisma/client.js'

import { uploadFileToCloudinary } from './cloudinary.service.js'

import { extractFileText } from './file-extraction.service.js'

const adapter = new PrismaPg({

  connectionString: process.env.DATABASE_URL!

})

const prisma = new PrismaClient({

  adapter

})

export const createAttachment = async (

  messageId: string,

  userId: string,

  file: Express.Multer.File

) => {

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

  if (

    file.mimetype === 'text/plain' ||

    file.mimetype === 'application/pdf'

  ) {

    extractedText = await extractFileText(

      file.path,

      file.mimetype

    )

  }

  const cloudinaryResult = await uploadFileToCloudinary(

    file.path,

    file.originalname

  )

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

  fs.unlinkSync(file.path)

  return attachment

}