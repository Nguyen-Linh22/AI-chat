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

/**
 * Xóa file trên Cloudinary khi xảy ra lỗi DB (compensating rollback).
 * Sử dụng đúng public_id và resource_type đã lưu khi upload.
 * Lỗi dọn dẹp được bắt và ghi log, không ghi đè lỗi gốc của request.
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
      `CLOUDINARY ROLLBACK: Đã xóa orphan file ${publicId} (${resourceType})`
    )
  } catch (error) {
    console.error(`CLOUDINARY ROLLBACK ERROR: Không thể xóa orphan file ${publicId}:`, error)
  }
}