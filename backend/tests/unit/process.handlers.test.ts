import { describe, it, expect, vi, afterEach, afterAll } from 'vitest'
import server, {
  handleUnhandledRejection,
  handleUncaughtException
} from '../../src/server.js'

describe('Process-Level Error Handlers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve())
      })
  )

  it('handleUnhandledRejection should log reason server-side without secrets', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const dummyReason = new Error('Async promise unhandled rejection')
    const dummyPromise = Promise.resolve()

    handleUnhandledRejection(dummyReason, dummyPromise)

    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled Rejection at:',
      dummyPromise,
      'reason:',
      dummyReason
    )
  })

  it('handleUncaughtException should log error and call process.exit(1)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const dummyError = new Error('Fatal uncaught error')

    handleUncaughtException(dummyError)

    expect(errorSpy).toHaveBeenCalledWith(
      'Uncaught Exception thrown:',
      dummyError
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
