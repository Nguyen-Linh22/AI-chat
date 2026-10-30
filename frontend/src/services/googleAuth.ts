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

export interface GsiButtonConfiguration {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number | string
  locale?: string
  click_listener?: () => void
}

export type GoogleCredentialCallback = (
  response: GoogleCredentialResponse
) => void | Promise<void>

export const getGoogleClientId = (): string => {
  const envVal =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    (typeof globalThis !== 'undefined' &&
      (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_GOOGLE_CLIENT_ID)
  return (envVal || '').trim()
}

let scriptLoadingPromise: Promise<void> | null = null
let activeCallback: GoogleCredentialCallback | null = null
let gsiInitializedClientId: string | null = null

/**
 * Đăng ký callback xử lý credential cho component đang active (LoginPage/RegisterPage).
 * Trả về hàm hủy đăng ký để gọi khi component unmount, ngăn callback gọi vào component cũ.
 */
export const registerGoogleCredentialCallback = (
  callback: GoogleCredentialCallback
): (() => void) => {
  activeCallback = callback
  return () => {
    if (activeCallback === callback) {
      activeCallback = null
    }
  }
}

/**
 * Reset trạng thái nội bộ của service Google Auth (phục vụ test isolation).
 */
export const resetGoogleAuthStateForTesting = (): void => {
  scriptLoadingPromise = null
  activeCallback = null
  gsiInitializedClientId = null
}

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
      existing.addEventListener(
        'error',
        () => reject(new Error('Không thể tải Google Identity Services')),
        { once: true }
      )
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
 * Đảm bảo chỉ gọi window.google.accounts.id.initialize duy nhất 1 lần cho cùng một clientId,
 * an toàn với React StrictMode và điều hướng giữa các trang.
 */
export const initGoogleIdentityServices = (options: {
  clientId: string
  callback?: GoogleCredentialCallback
}): void => {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    throw new Error('Google Identity Services chưa sẵn sàng')
  }

  if (options.callback) {
    activeCallback = options.callback
  }

  // Nếu cùng clientId đã được khởi tạo trước đó, chỉ cập nhật callback mà không gọi lại initialize
  // để tránh cảnh báo "google.accounts.id.initialize() is called multiple times".
  if (gsiInitializedClientId === options.clientId) {
    return
  }

  window.google.accounts.id.initialize({
    client_id: options.clientId,
    callback: (response: GoogleCredentialResponse) => {
      if (activeCallback) {
        activeCallback(response)
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin',
  })

  gsiInitializedClientId = options.clientId
}

/**
 * Render nút Google chính thức theo chuẩn Google Identity Services.
 * Xử lý native user activation, FedCM button mode và popup fallback.
 */
export const renderGoogleButton = (
  parent: HTMLElement,
  options?: GsiButtonConfiguration
): void => {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    throw new Error('Google Identity Services chưa sẵn sàng để render nút')
  }

  // Xóa nội dung cũ trong container trước khi render lại (tránh nhân bản nút khi remount)
  parent.innerHTML = ''

  window.google.accounts.id.renderButton(parent, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: 320,
    ...options,
  })
}

/**
 * Kích hoạt hiển thị Google One Tap prompt (nếu cần).
 */
export const promptGoogleSignIn = (onDismissed?: () => void): void => {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
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
