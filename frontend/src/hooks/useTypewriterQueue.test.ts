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

  // === Patch 2.1 Regression Tests: Unicode Slicing ===
  it('Patch 2.1: should not split surrogate pairs across tick boundary', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    // 9 ASCII chars + emoji '🎉' (2 UTF-16 code units at index 9 and 10)
    // Legacy slice(0, 10) would split 🎉 into \uD83C and \uDF89
    const textWithEmoji = '123456789🎉'

    act(() => {
      result.current.enqueue(textWithEmoji, onUpdate)
    })

    act(() => {
      vi.advanceTimersByTime(20)
    })

    // First tick must include the entire emoji (11 code units), never a lone surrogate
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const firstOutput = onUpdate.mock.calls[0][0]
    expect(firstOutput).toBe('123456789🎉')
    // Verify no lone high surrogate
    expect(firstOutput.charCodeAt(firstOutput.length - 1)).not.toBe(0xd83c)
  })

  it('Patch 2.1: should preserve complex grapheme clusters: skin tones, flags, ZWJ and Vietnamese combining marks', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    // 8 ASCII chars + Flag of Vietnam '🇻🇳' (4 code units: \uD83C\uDDFB\uD83C\uDDF3)
    // 8 ASCII chars + Thumb up medium-skin tone '👍🏽' (4 code units: \uD83D\uDC4D\uD83C\uDFFD)
    // 8 ASCII chars + Family ZWJ '👨‍👩‍👧‍👦' (11 code units)
    // Vietnamese decomposed 'e\u0302\u0323' (ệ)
    const complexText = '12345678🇻🇳87654321👍🏽abcdefgh👨‍👩‍👧‍👦Vi\u0323\u0302t Nam'

    act(() => {
      result.current.enqueue(complexText, onUpdate)
    })

    // Advance all timers until queue is completely drained
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Every intermediate emission must not contain broken surrogate pairs
    for (const call of onUpdate.mock.calls) {
      const text = call[0] as string
      // Test regex: ensure no unmatched surrogate
      const hasLoneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)
      expect(hasLoneSurrogate).toBe(false)
    }

    // Final output must match the original text completely
    expect(onUpdate).toHaveBeenLastCalledWith(complexText)
  })

  // === Patch 2.1 Regression Tests: waitDrained Lifecycle ===
  it('Patch 2.1: multiple concurrent callers to waitDrained() all resolve when queue drains', async () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue('Test multi-waiter message', onUpdate)
    })

    let waiter1Resolved = false
    let waiter2Resolved = false
    let waiter3Resolved = false

    const p1 = result.current.waitDrained().then(() => {
      waiter1Resolved = true
    })
    const p2 = result.current.waitDrained().then(() => {
      waiter2Resolved = true
    })
    const p3 = result.current.waitDrained().then(() => {
      waiter3Resolved = true
    })

    await Promise.resolve()
    expect(waiter1Resolved).toBe(false)
    expect(waiter2Resolved).toBe(false)
    expect(waiter3Resolved).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    await Promise.all([p1, p2, p3])
    expect(waiter1Resolved).toBe(true)
    expect(waiter2Resolved).toBe(true)
    expect(waiter3Resolved).toBe(true)
  })

  it('Patch 2.1: reset() resolves all pending waitDrained() promises without hanging', async () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue('A very long message waiting in queue', onUpdate)
    })

    let waiterResolved = false
    const waitPromise = result.current.waitDrained().then(() => {
      waiterResolved = true
    })

    await Promise.resolve()
    expect(waiterResolved).toBe(false)

    // Reset while promise is waiting
    act(() => {
      result.current.reset()
    })

    await waitPromise
    // Promise must resolve immediately and not hang
    expect(waiterResolved).toBe(true)
  })

  it('Patch 2.1: flushAll() emits remaining content before resolving pending waitDrained() promises', async () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue('Complete text must be emitted first', onUpdate)
    })

    let contentAtDrain: string | null = null
    const waitPromise = result.current.waitDrained().then(() => {
      contentAtDrain = onUpdate.mock.calls.length > 0 ? onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0] : null
    })

    act(() => {
      result.current.flushAll()
    })

    await waitPromise
    expect(contentAtDrain).toBe('Complete text must be emitted first')
    expect(onUpdate).toHaveBeenLastCalledWith('Complete text must be emitted first')
  })

  it('Patch 2.1: calling reset() or flushAll() multiple times is idempotent and safe', () => {
    const { result } = renderHook(() => useTypewriterQueue())
    const onUpdate = vi.fn()

    act(() => {
      result.current.enqueue('Some text', onUpdate)
    })

    expect(() => {
      act(() => {
        result.current.flushAll()
        result.current.flushAll()
        result.current.flushAll()
        result.current.reset()
        result.current.reset()
      })
    }).not.toThrow()
  })
})
