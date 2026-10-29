export {}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string; select_by?: string }) => void | Promise<void>
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
            context?: string
            prompt_parent_id?: string
            [key: string]: any
          }) => void
          prompt: (callback?: (notification: {
            isNotDisplayed?: () => boolean
            isSkippedMoment?: () => boolean
            isDismissedMoment?: () => boolean
            getNotDisplayedReason?: () => string
            getSkippedReason?: () => string
            getDismissedReason?: () => string
            [key: string]: any
          }) => void) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string
              theme?: string
              size?: string
              text?: string
              shape?: string
              logo_alignment?: string
              width?: number | string
              locale?: string
              [key: string]: any
            }
          ) => void
          disableAutoSelect: () => void
          cancel: () => void
          revoke: (hint: string, callback: (done: any) => void) => void
        }
      }
    }
  }
}
