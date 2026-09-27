import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTypewriterQueue } from './useTypewriterQueue'

describe('useTypewriterQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should enqueue text and output 10 characters per tick', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue('Hello World!', onUpdate)
    })

    expect(onUpdate).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onUpdate).toHaveBeenLastCalledWith('Hello Worl')

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onUpdate).toHaveBeenLastCalledWith('Hello World!')
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('should process multiple chunks continuously', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue('Hello', onUpdate)
      result.current.enqueue(' World', onUpdate)
      result.current.enqueue('!', onUpdate)
    })

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onUpdate).toHaveBeenLastCalledWith('Hello Worl')

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onUpdate).toHaveBeenLastCalledWith('Hello World!')
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('should resolve waitDrained immediately when there is nothing to drain', async () => {
    const { result } = renderHook(() => useTypewriterQueue())

    await expect(result.current.waitDrained()).resolves.toBeUndefined()
  })

  it('should resolve waitDrained only after the queue is fully drained', async () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    let drained = false

    act(() => {
      result.current.enqueue('Hello World!', onUpdate)
    })

    const drainPromise = result.current.waitDrained().then(() => {
      drained = true
    })

    await Promise.resolve()

    expect(drained).toBe(false)

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(drained).toBe(false)

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(drained).toBe(false)

    act(() => {
      vi.advanceTimersByTime(20)
    })

    await drainPromise

    expect(drained).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith('Hello World!')
  })

  it('should flush all remaining text immediately', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue(
        'This is a long message',
        onUpdate
      )
    })

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onUpdate).toHaveBeenLastCalledWith('This is a ')

    act(() => {
      result.current.flushAll()
    })

    expect(onUpdate).toHaveBeenLastCalledWith(
      'This is a long message'
    )

    expect(onUpdate).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('should reset the queue and stop future updates', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue(
        'This message should be cleared',
        onUpdate
      )
    })

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onUpdate).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.reset()
    })

    const callsAfterReset = onUpdate.mock.calls.length

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onUpdate).toHaveBeenCalledTimes(callsAfterReset)
  })

  it('should use the latest onUpdate callback for newly enqueued chunks', () => {
    const { result } = renderHook(() => useTypewriterQueue())

    const firstOnUpdate = vi.fn()
    const secondOnUpdate = vi.fn()

    act(() => {
      result.current.enqueue('Hello', firstOnUpdate)
    })

    act(() => {
      result.current.enqueue(' World', secondOnUpdate)
    })

    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(secondOnUpdate).toHaveBeenCalled()
    expect(firstOnUpdate).not.toHaveBeenCalled()
  })
})
