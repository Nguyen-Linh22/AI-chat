export const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176'
]

export const getAllowedOrigins = (): string[] => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []
  }

  const configured = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []
  return Array.from(new Set([...configured, ...LOCAL_DEV_ORIGINS]))
}
