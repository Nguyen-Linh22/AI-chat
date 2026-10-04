export const getAllowedOrigins = (): string[] => {
  if (process.env.FRONTEND_URL) {
    return [process.env.FRONTEND_URL.replace(/\/$/, '')]
  }
  return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']
}
