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