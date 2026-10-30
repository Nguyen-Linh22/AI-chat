import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  initGoogleIdentityServices,
  registerGoogleCredentialCallback,
  renderGoogleButton,
  resetGoogleAuthStateForTesting,
  getGoogleClientId,
} from './googleAuth'

describe('googleAuth Service', () => {
  let mockInitialize: ReturnType<typeof vi.fn>
  let mockRenderButton: ReturnType<typeof vi.fn>
  let capturedGsiCallback: ((response: any) => void) | null = null

  beforeEach(() => {
    resetGoogleAuthStateForTesting()
    capturedGsiCallback = null

    mockInitialize = vi.fn().mockImplementation((opts: any) => {
      capturedGsiCallback = opts.callback
    })
    mockRenderButton = vi.fn()

    window.google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          prompt: vi.fn(),
          renderButton: mockRenderButton,
          disableAutoSelect: vi.fn(),
          cancel: vi.fn(),
          revoke: vi.fn(),
        },
      },
    }

    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com')
  })

  it('reads Google Client ID from environment', () => {
    expect(getGoogleClientId()).toBe('test-client-id.apps.googleusercontent.com')
  })

  it('initializes GIS with correct client_id, auto_select, cancel_on_tap_outside, context', () => {
    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })

    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockInitialize).toHaveBeenCalledWith({
      client_id: 'test-client-id.apps.googleusercontent.com',
      callback: expect.any(Function),
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
    })
  })

  it('does NOT call window.google.accounts.id.initialize multiple times for same clientId (idempotent for StrictMode)', () => {
    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })
    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })
    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })

    expect(mockInitialize).toHaveBeenCalledTimes(1)
  })

  it('dispatches incoming GIS credentials to the registered callback', () => {
    const callbackMock = vi.fn()
    registerGoogleCredentialCallback(callbackMock)

    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })
    expect(capturedGsiCallback).toBeTypeOf('function')

    capturedGsiCallback!({ credential: 'sample-jwt-credential' })
    expect(callbackMock).toHaveBeenCalledWith({ credential: 'sample-jwt-credential' })
  })

  it('switches callback seamlessly when navigating between pages (Login -> Register)', () => {
    const loginCallback = vi.fn()
    const registerCallback = vi.fn()

    // 1. User is on LoginPage
    const unregisterLogin = registerGoogleCredentialCallback(loginCallback)
    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })

    // 2. User navigates to RegisterPage: LoginPage unmounts, RegisterPage registers
    unregisterLogin()
    registerGoogleCredentialCallback(registerCallback)

    // GIS credential arrives
    capturedGsiCallback!({ credential: 'new-account-credential' })

    expect(loginCallback).not.toHaveBeenCalled()
    expect(registerCallback).toHaveBeenCalledWith({ credential: 'new-account-credential' })
  })

  it('does not dispatch credential if component has unregistered (unmounted)', () => {
    const callbackMock = vi.fn()
    const unregister = registerGoogleCredentialCallback(callbackMock)

    initGoogleIdentityServices({ clientId: 'test-client-id.apps.googleusercontent.com' })
    unregister()

    capturedGsiCallback!({ credential: 'post-unmount-credential' })
    expect(callbackMock).not.toHaveBeenCalled()
  })

  it('calls window.google.accounts.id.renderButton with filled_black and specified options', () => {
    const container = document.createElement('div')
    renderGoogleButton(container, {
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 320,
    })

    expect(mockRenderButton).toHaveBeenCalledTimes(1)
    expect(mockRenderButton).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      })
    )
  })
})

