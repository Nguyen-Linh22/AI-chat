import { useRef, useCallback } from 'react'

// Số ký tự xuất ra mỗi tick (20ms)
// 10 chars / 20ms = ~500 chars/giây — mượt mà, phản hồi nhanh và tự nhiên
const CHARS_PER_TICK = 10
const TICK_MS = 20

export function useTypewriterQueue() {
  // Hàng đợi ký tự chưa được hiển thị
  const queueRef = useRef<string>('')
  // Nội dung đã được hiển thị (tích lũy)
  const accRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onUpdateRef = useRef<((content: string) => void) | null>(null)
  const drainResolveRef = useRef<(() => void) | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) return

    timerRef.current = setInterval(() => {
      if (queueRef.current.length === 0) {
        stopTimer()
        // Báo hiệu queue đã drain xong
        const resolve = drainResolveRef.current
        drainResolveRef.current = null
        resolve?.()
        return
      }

      const chars = queueRef.current.slice(0, CHARS_PER_TICK)
      queueRef.current = queueRef.current.slice(CHARS_PER_TICK)
      accRef.current += chars
      onUpdateRef.current?.(accRef.current)
    }, TICK_MS)
  }, [stopTimer])

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
   */
  const waitDrained = useCallback((): Promise<void> => {
    if (queueRef.current.length === 0 && !timerRef.current) {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      drainResolveRef.current = resolve
    })
  }, [])

  /**
   * Flush toàn bộ queue ngay lập tức (khi user bấm Dừng).
   * Show tất cả ký tự còn trong hàng đợi rồi resolve waitDrained.
   */
  const flushAll = useCallback(() => {
    stopTimer()
    if (queueRef.current.length > 0) {
      accRef.current += queueRef.current
      queueRef.current = ''
      onUpdateRef.current?.(accRef.current)
    }
    const resolve = drainResolveRef.current
    drainResolveRef.current = null
    resolve?.()
  }, [stopTimer])

  /**
   * Xóa toàn bộ trạng thái (dùng khi có lỗi thật sự).
   */
  const reset = useCallback(() => {
    stopTimer()
    queueRef.current = ''
    accRef.current = ''
    onUpdateRef.current = null
    drainResolveRef.current = null
  }, [stopTimer])

  return { enqueue, waitDrained, flushAll, reset }
}
