export interface AuditMetrics {
  totalAiRequests: number
  completedAiRequests: number
  totalRateLimited: number
  totalAiTimeouts: number
  totalAiErrors: number
}

const metrics: AuditMetrics = {
  totalAiRequests: 0,
  completedAiRequests: 0,
  totalRateLimited: 0,
  totalAiTimeouts: 0,
  totalAiErrors: 0
}

/**
 * Log khi bắt đầu một yêu cầu AI.
 * Chỉ log metadata (userId, chatId, provider, model), tuyệt đối KHÔNG log prompt hoặc user content.
 */
export const logAiRequestStart = (data: {
  userId: string
  chatId: string
  provider: string
  model: string
}): void => {
  metrics.totalAiRequests++
  console.log(
    `AI request started: userId=${data.userId} chatId=${data.chatId} provider=${data.provider} model=${data.model}`
  )
}

/**
 * Log khi hoàn tất yêu cầu AI.
 * Chỉ log metadata và thời lượng xử lý durationMs, tuyệt đối KHÔNG log response content.
 */
export const logAiRequestCompleted = (data: {
  userId: string
  chatId: string
  provider: string
  model: string
  durationMs: number
}): void => {
  metrics.completedAiRequests++
  console.log(
    `AI request completed: userId=${data.userId} chatId=${data.chatId} provider=${data.provider} model=${data.model} durationMs=${data.durationMs}`
  )
}

/**
 * Log khi yêu cầu AI bị timeout.
 */
export const logAiRequestTimeout = (data: {
  provider: string
  model: string
  durationMs: number
}): void => {
  metrics.totalAiTimeouts++
  console.warn(
    `AI request timeout: provider=${data.provider} model=${data.model} durationMs=${data.durationMs}`
  )
}

/**
 * Log khi yêu cầu AI thất bại do lỗi kỹ thuật hoặc provider.
 * Chỉ log provider, model, tên lỗi errorName và durationMs; không log stack trace hay prompt.
 */
export const logAiRequestFailed = (data: {
  provider: string
  model: string
  errorName: string
  durationMs: number
}): void => {
  metrics.totalAiErrors++
  console.error(
    `AI request failed: provider=${data.provider} model=${data.model} errorName=${data.errorName} durationMs=${data.durationMs}`
  )
}

/**
 * Log khi một request bị chặn bởi rate limiter (HTTP 429).
 * Tuyệt đối KHÔNG log body hoặc token.
 */
export const logRateLimitExceeded = (data: {
  route: string
  userId?: string
  ip?: string
}): void => {
  metrics.totalRateLimited++
  console.warn(
    `Rate limit exceeded: route=${data.route} userId=${data.userId || 'anonymous'} ip=${data.ip || 'unknown'}`
  )
}

/**
 * Lấy số liệu thống kê giám sát (monitoring metrics).
 */
export const getAuditMetrics = (): Readonly<AuditMetrics> => {
  return { ...metrics }
}

/**
 * Reset metrics (chủ yếu phục vụ unit test).
 */
export const resetAuditMetrics = (): void => {
  metrics.totalAiRequests = 0
  metrics.completedAiRequests = 0
  metrics.totalRateLimited = 0
  metrics.totalAiTimeouts = 0
  metrics.totalAiErrors = 0
}
