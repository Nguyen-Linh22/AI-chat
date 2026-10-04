import cloudinary from '../config/cloudinary.js'

export const uploadFileToCloudinary = async (
  filePath: string,
  fileName: string
) => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    filename_override: fileName
  })

  return result
}

export const getResourceTypeFromMime = (mimeType?: string): 'image' | 'raw' => {
  if (mimeType && mimeType.startsWith('image/')) {
    return 'image'
  }
  return 'raw'
}

/**
 * Xóa file trên Cloudinary khi xảy ra lỗi DB (rollback) hoặc khi user xóa Message/Chat.
 * Sử dụng đúng public_id và resource_type đã lưu.
 * Lỗi dọn dẹp được bắt và ghi log server-side, không làm crash luồng xóa DB.
 */
export const deleteFileFromCloudinary = async (
  publicId?: string,
  resourceType: 'image' | 'raw' | 'video' | string = 'image'
): Promise<void> => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as any
    })
    console.log(
      `CLOUDINARY CLEANUP: Đã xóa file ${publicId} (${resourceType})`
    )
  } catch (error) {
    console.error(`CLOUDINARY CLEANUP ERROR: Không thể xóa file ${publicId}:`, error)
  }
}

/**
 * Xóa danh sách file đính kèm trên Cloudinary một cách an toàn.
 * Bỏ qua các attachment không có cloudinaryPublicId (backward-compatibility).
 */
export const cleanupCloudinaryAttachments = async (
  attachments: Array<{ cloudinaryPublicId: string | null; fileType: string }>
): Promise<void> => {
  for (const attachment of attachments) {
    if (attachment.cloudinaryPublicId) {
      const resourceType = getResourceTypeFromMime(attachment.fileType)
      await deleteFileFromCloudinary(attachment.cloudinaryPublicId, resourceType)
    }
  }
}