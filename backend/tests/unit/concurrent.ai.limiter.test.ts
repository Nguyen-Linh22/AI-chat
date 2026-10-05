import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventEmitter } from 'events'
import type { Request, Response } from 'express'
import {
  concurrentAiLimiter,
  clearActiveAIRequests,
  getActiveAIRequestCount
} from '../../src/middlewares/rate-limit.middleware.js'

describe('16.10-B Concurrent AI Limiter Unit Test', () => {
  beforeEach(() => {
    clearActiveAIRequests()
  })

  const createMockReqRes = (userId?: string) => {
    const emitter = new EventEmitter()
    const req = {
      userId,
      originalUrl: '/api/chats/1/messages/stream',
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' }
    } as unknown as Request

    let statusCode = 200
    let jsonBody: any = null

    const res = Object.assign(emitter, {
      status: vi.fn((code: number) => {
        statusCode = code
        return res
      }),
      json: vi.fn((data: any) => {
        jsonBody = data
        return res
      }),
      getStatusCode: () => statusCode,
      getJsonBody: () => jsonBody
    }) as unknown as Response & { getStatusCode: () => number; getJsonBody: () => any }

    const next = vi.fn()

    return { req, res, next }
  }

  it('request đầu tiên của cùng user được phép (gọi next và giữ lock)', () => {
    const userId = 'user-1'
    const { req, res, next } = createMockReqRes(userId)

    concurrentAiLimiter(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(getActiveAIRequestCount(userId)).toBe(1)
  })

  it('request thứ hai đồng thời của cùng user nhận 429 và không gọi next', () => {
    const userId = 'user-1'
    const req1 = createMockReqRes(userId)
    const req2 = createMockReqRes(userId)

    // Request 1 đang xử lý
    concurrentAiLimiter(req1.req, req1.res, req1.next)
    expect(req1.next).toHaveBeenCalledTimes(1)
    expect(getActiveAIRequestCount(userId)).toBe(1)

    // Request 2 đồng thời từ cùng user
    concurrentAiLimiter(req2.req, req2.res, req2.next)

    expect(req2.next).not.toHaveBeenCalled()
    expect(req2.res.status).toHaveBeenCalledWith(429)
    expect(req2.res.getJsonBody()).toEqual({
      message: 'Bạn đang có một yêu cầu AI đang xử lý. Vui lòng chờ phản hồi hiện tại hoàn thành trước khi gửi tiếp.'
    })
    expect(getActiveAIRequestCount(userId)).toBe(1)
  })

  it('sau khi request đầu tiên kết thúc (res.finish) thì lock được release và request tiếp theo được phép', () => {
    const userId = 'user-1'
    const req1 = createMockReqRes(userId)

    concurrentAiLimiter(req1.req, req1.res, req1.next)
    expect(getActiveAIRequestCount(userId)).toBe(1)

    // Request 1 hoàn tất
    req1.res.emit('finish')
    expect(getActiveAIRequestCount(userId)).toBe(0)

    // Request tiếp theo được phép
    const req2 = createMockReqRes(userId)
    concurrentAiLimiter(req2.req, req2.res, req2.next)

    expect(req2.next).toHaveBeenCalledTimes(1)
    expect(req2.res.status).not.toHaveBeenCalled()
    expect(getActiveAIRequestCount(userId)).toBe(1)
  })

  it('lock được release an toàn khi client ngắt kết nối giữa chừng (res.close)', () => {
    const userId = 'user-abort'
    const { req, res, next } = createMockReqRes(userId)

    concurrentAiLimiter(req, res, next)
    expect(getActiveAIRequestCount(userId)).toBe(1)

    // Client đóng kết nối
    res.emit('close')
    expect(getActiveAIRequestCount(userId)).toBe(0)
  })

  it('hai user khác nhau không block lẫn nhau khi chạy đồng thời', () => {
    const userA = 'user-A'
    const userB = 'user-B'

    const reqA = createMockReqRes(userA)
    const reqB = createMockReqRes(userB)

    concurrentAiLimiter(reqA.req, reqA.res, reqA.next)
    concurrentAiLimiter(reqB.req, reqB.res, reqB.next)

    expect(reqA.next).toHaveBeenCalledTimes(1)
    expect(reqB.next).toHaveBeenCalledTimes(1)
    expect(reqA.res.status).not.toHaveBeenCalled()
    expect(reqB.res.status).not.toHaveBeenCalled()

    expect(getActiveAIRequestCount(userA)).toBe(1)
    expect(getActiveAIRequestCount(userB)).toBe(1)

    reqA.res.emit('finish')
    expect(getActiveAIRequestCount(userA)).toBe(0)
    expect(getActiveAIRequestCount(userB)).toBe(1)

    reqB.res.emit('finish')
    expect(getActiveAIRequestCount(userB)).toBe(0)
  })

  it('cho phép request đi tiếp nếu không có userId (unauthenticated fallback)', () => {
    const { req, res, next } = createMockReqRes(undefined)

    concurrentAiLimiter(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('cleanup không để lại activeAIRequests', () => {
    const user = 'user-cleanup'
    const { req, res, next } = createMockReqRes(user)

    concurrentAiLimiter(req, res, next)
    expect(getActiveAIRequestCount(user)).toBe(1)

    clearActiveAIRequests()
    expect(getActiveAIRequestCount(user)).toBe(0)
  })
})
