export interface GoogleNotification {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
  isDismissedMoment?: () => boolean
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
  getDismissedReason?: () => string
}

export interface GoogleCredentialResponse {
  credential?: string
  select_by?: string
}

export const getGoogleClientId = (): string => {
  const envVal =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    (typeof globalThis !== 'undefined' &&
      (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_GOOGLE_CLIENT_ID)
  return (envVal || '').trim()
}

let scriptLoadingPromise: Promise<void> | null = null

/**
 * Tải mã kịch bản Google Identity Services (GSI) bất đồng bộ.
 * Tránh tải lặp lại nếu script đã tồn tại trên trang.
 */
export const loadGoogleScript = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existing) {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Không thể tải Google Identity Services')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadingPromise = null
      reject(new Error('Không thể tải thư viện Google Identity Services'))
    }
    document.head.appendChild(script)
  })

  return scriptLoadingPromise
}

/**
 * Khởi tạo cấu hình Google Identity Services.
 */
export const initGoogleIdentityServices = (options: {
  clientId: string
  callback: (response: GoogleCredentialResponse) => void | Promise<void>
}) => {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services chưa sẵn sàng')
  }

  window.google.accounts.id.initialize({
    client_id: options.clientId,
    callback: options.callback,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin'
  })
}

/**
 * Kích hoạt hiển thị Google One Tap / Account Picker prompt.
 */
export const promptGoogleSignIn = (onDismissed?: () => void) => {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services chưa sẵn sàng')
  }

  window.google.accounts.id.prompt((notification: GoogleNotification) => {
    if (
      notification.isNotDisplayed?.() ||
      notification.isSkippedMoment?.() ||
      notification.isDismissedMoment?.()
    ) {
      onDismissed?.()
    }
  })
}
