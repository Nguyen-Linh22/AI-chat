import { useRef, useCallback } from 'react'

// Số ký tự xuất ra mỗi tick (20ms)
// 10 chars / 20ms = ~500 chars/giây — mượt mà, phản hồi nhanh và tự nhiên
const CHARS_PER_TICK = 10
const TICK_MS = 20

const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null

/**
 * Tính toán index an toàn để cắt chuỗi mà không làm rách surrogate pair
 * hoặc grapheme cluster (emoji, cờ, skin tone, ZWJ, dấu tổ hợp tiếng Việt).
 */
export function getNextSliceIndex(str: string, targetCount: number): number {
  if (str.length <= targetCount) return str.length

  if (segmenter) {
    let index = 0
    let graphemeCount = 0
    for (const segment of segmenter.segment(str)) {
      index = segment.index + segment.segment.length
      graphemeCount++
      if (index >= targetCount || graphemeCount >= targetCount) {
        break
      }
    }
    return index > 0 ? index : targetCount
  }

  // Fallback nếu môi trường không có Intl.Segmenter:
  // Không cắt đôi surrogate pair và giữ nguyên combining marks
  let index = targetCount
  const prevCode = str.charCodeAt(index - 1)
  if (prevCode >= 0xd800 && prevCode <= 0xdbff && index < str.length) {
    index++
  }
  while (index < str.length) {
    const code = str.charCodeAt(index)
    if (code >= 0x0300 && code <= 0x036f) {
      index++
    } else {
      break
    }
  }
  return index
}

export function useTypewriterQueue() {
  // Hàng đợi ký tự chưa được hiển thị
  const queueRef = useRef<string>('')
  // Nội dung đã được hiển thị (tích lũy)
  const accRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onUpdateRef = useRef<((content: string) => void) | null>(null)
  // Danh sách các resolver đang chờ queue drain (hỗ trợ nhiều caller)
  const drainResolversRef = useRef<Array<() => void>>([])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resolveAllWaiters = useCallback(() => {
    if (drainResolversRef.current.length > 0) {
      const resolvers = drainResolversRef.current
      drainResolversRef.current = []
      for (const resolve of resolvers) {
        resolve()
      }
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) return

    timerRef.current = setInterval(() => {
      if (queueRef.current.length === 0) {
        stopTimer()
        // Báo hiệu queue đã drain xong tới tất cả caller đang chờ
        resolveAllWaiters()
        return
      }

      const sliceIdx = getNextSliceIndex(queueRef.current, CHARS_PER_TICK)
      const chars = queueRef.current.slice(0, sliceIdx)
      queueRef.current = queueRef.current.slice(sliceIdx)
      accRef.current += chars
      onUpdateRef.current?.(accRef.current)
    }, TICK_MS)
  }, [stopTimer, resolveAllWaiters])

  /**
   * Thêm chunk vào hàng đợi và bắt đầu drain.
   * @param chunk   Đoạn text nhận được từ AI stream
   * @param onUpdate Callback được gọi sau mỗi ký tự với toàn bộ nội dung tích lũy
   */
  const enqueue = useCallback(
    (chunk: string, onUpdate: (content: string) => void) => {
      onUpdateRef.current = onUpdate
      queueRef.current += chunk
      startTimer()
    },
    [startTimer]
  )

  /**
   * Trả về Promise resolve khi queue hoàn toàn trống.
   * Dùng để đợi typewriter chạy xong trước khi thực hiện bước tiếp theo.
   * Hỗ trợ nhiều caller đồng thời mà không ghi đè lẫn nhau.
   */
  const waitDrained = useCallback((): Promise<void> => {
    if (queueRef.current.length === 0 && !timerRef.current) {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      drainResolversRef.current.push(resolve)
    })
  }, [])

  /**
   * Flush toàn bộ queue ngay lập tức (khi user bấm Dừng).
   * Show tất cả ký tự còn trong hàng đợi rồi resolve toàn bộ waitDrained.
   */
  const flushAll = useCallback(() => {
    stopTimer()
    if (queueRef.current.length > 0) {
      accRef.current += queueRef.current
      queueRef.current = ''
      onUpdateRef.current?.(accRef.current)
    }
    resolveAllWaiters()
  }, [stopTimer, resolveAllWaiters])

  /**
   * Xóa toàn bộ trạng thái (dùng khi có lỗi hoặc reset stream).
   * Hoàn tất mọi Promise đang chờ để tránh treo caller.
   */
  const reset = useCallback(() => {
    stopTimer()
    queueRef.current = ''
    accRef.current = ''
    onUpdateRef.current = null
    resolveAllWaiters()
  }, [stopTimer, resolveAllWaiters])

  return { enqueue, waitDrained, flushAll, reset }
}
