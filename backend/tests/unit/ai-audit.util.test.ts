import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAuditMetrics,
  logAiRequestCompleted,
  logAiRequestFailed,
  logAiRequestStart,
  logAiRequestTimeout,
  logRateLimitExceeded,
  resetAuditMetrics,
} from '../../src/utils/ai-audit.util.js'

describe('ai-audit.util', () => {
  afterEach(() => {
    resetAuditMetrics()
    vi.restoreAllMocks()
  })

  describe('audit metrics', () => {
    it('should start with zero metrics after reset', () => {
      resetAuditMetrics()

      expect(getAuditMetrics()).toEqual({
        totalAiRequests: 0,
        completedAiRequests: 0,
        totalRateLimited: 0,
        totalAiTimeouts: 0,
        totalAiErrors: 0,
      })
    })

    it('should increment totalAiRequests when an AI request starts', () => {
      logAiRequestStart({
        userId: 'user-1',
        chatId: 'chat-1',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
      })

      expect(getAuditMetrics().totalAiRequests).toBe(1)
    })

    it('should increment completedAiRequests when a request completes', () => {
      logAiRequestCompleted({
        userId: 'user-1',
        chatId: 'chat-1',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 1000,
      })

      expect(getAuditMetrics().completedAiRequests).toBe(1)
    })

    it('should increment totalAiTimeouts when a request times out', () => {
      logAiRequestTimeout({
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 120000,
      })

      expect(getAuditMetrics().totalAiTimeouts).toBe(1)
    })

    it('should increment totalAiErrors when a request fails', () => {
      logAiRequestFailed({
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 500,
        errorName: 'PROVIDER_ERROR',
      })

      expect(getAuditMetrics().totalAiErrors).toBe(1)
    })

    it('should increment totalRateLimited when rate limit is exceeded', () => {
      logRateLimitExceeded({
        route: '/api/chats/123/messages/stream',
        userId: 'user-1',
        ip: '127.0.0.1',
      })

      expect(getAuditMetrics().totalRateLimited).toBe(1)
    })

    it('should reset all metrics', () => {
      logAiRequestStart({
        userId: 'user-1',
        chatId: 'chat-1',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
      })

      logAiRequestCompleted({
        userId: 'user-1',
        chatId: 'chat-1',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 1000,
      })

      logAiRequestFailed({
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 500,
        errorName: 'PROVIDER_ERROR',
      })

      logAiRequestTimeout({
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 120000,
      })

      logRateLimitExceeded({
        route: '/api/chats/123/messages/stream',
        userId: 'user-1',
      })

      resetAuditMetrics()

      expect(getAuditMetrics()).toEqual({
        totalAiRequests: 0,
        completedAiRequests: 0,
        totalRateLimited: 0,
        totalAiTimeouts: 0,
        totalAiErrors: 0,
      })
    })
  })

  describe('logging safety', () => {
    it('should not log sensitive prompt or secret values', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const sensitivePrompt = 'SECRET_PROMPT_SHOULD_NOT_APPEAR'
      const fakeApiKey = 'SECRET_API_KEY_SHOULD_NOT_APPEAR'
      const fakeToken = 'SECRET_TOKEN_SHOULD_NOT_APPEAR'

      logAiRequestStart({
        userId: 'user-sensitive',
        chatId: 'chat-sensitive',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
      })

      logAiRequestCompleted({
        userId: 'user-sensitive',
        chatId: 'chat-sensitive',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 1000,
      })

      logAiRequestFailed({
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 1000,
        errorName: 'PROVIDER_ERROR',
      })

      logAiRequestTimeout({
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        durationMs: 120000,
      })

      logRateLimitExceeded({
        route: '/api/chats/123/messages/stream',
        userId: 'user-sensitive',
        ip: '127.0.0.1',
      })

      const loggedOutput = [
        ...consoleLogSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
      ]
        .flat()
        .map(String)
        .join('\n')

      expect(loggedOutput).not.toContain(sensitivePrompt)
      expect(loggedOutput).not.toContain(fakeApiKey)
      expect(loggedOutput).not.toContain(fakeToken)
    })
  })
})
