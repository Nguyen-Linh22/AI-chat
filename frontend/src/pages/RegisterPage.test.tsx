import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useMessageStore } from '../stores/messageStore'
import { resetGoogleAuthStateForTesting } from '../services/googleAuth'
import RegisterPage from './RegisterPage'

const {
  postMock,
  getChatsMock,
  setUserMock,
  setChatsMock,
  setCurrentChatIdMock,
  navigateMock,
} = vi.hoisted(() => ({
  postMock: vi.fn(),
  getChatsMock: vi.fn(),
  setUserMock: vi.fn(),
  setChatsMock: vi.fn(),
  setCurrentChatIdMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../services/apiClient', () => ({
  apiClient: {
    post: postMock,
  },
}))

vi.mock('../services/chatService', () => ({
  getChats: getChatsMock,
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { setUser: typeof setUserMock }) => unknown) =>
    selector({
      setUser: setUserMock,
    }),
}))

vi.mock('../stores/chatStore', () => ({
  useChatStore: (
    selector: (state: {
      setChats: typeof setChatsMock
      setCurrentChatId: typeof setCurrentChatIdMock
    }) => unknown
  ) =>
    selector({
      setChats: setChatsMock,
      setCurrentChatId: setCurrentChatIdMock,
    }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  )

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )
}

async function fillRegisterForm(
  user: ReturnType<typeof userEvent.setup>,
  {
    email = 'test@example.com',
    password = 'password123',
    confirmPassword = password,
  }: { email?: string; password?: string; confirmPassword?: string } = {}
) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText(/M.*t kh.*u/), password)
  await user.type(
    screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/),
    confirmPassword
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders register form', () => {
    renderRegisterPage()

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText(/M.*t kh.*u/)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/)
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /ng k/ })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /ng nh.*p/ })
    ).toBeInTheDocument()
  })

  it('updates email, password, and confirm password inputs', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await fillRegisterForm(user)

    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com')
    expect(screen.getByLabelText(/M.*t kh.*u/)).toHaveValue('password123')
    expect(
      screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/)
    ).toHaveValue('password123')
  })

  it('shows error and does not call API when passwords do not match', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await fillRegisterForm(user, {
      password: 'password123',
      confirmPassword: 'different-password',
    })

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    expect(
      await screen.findByText(/M.*t kh.*u x.*c nh.*n kh.*ng kh.*p/)
    ).toBeInTheDocument()

    expect(postMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('requires at least 8 characters before calling the API', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await fillRegisterForm(user, {
      password: 'short',
      confirmPassword: 'short',
    })

    await user.click(screen.getByRole('button', { name: /ng k/ }))

    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 8 ký tự.')
    ).toBeInTheDocument()

    expect(postMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('shows the password strength label and criteria checklist', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(screen.getByLabelText(/M.*t kh.*u/), 'Abc!123456')

    expect(screen.getByText('Mạnh')).toBeInTheDocument()
    expect(screen.getByText('Ít nhất 8 ký tự')).toBeInTheDocument()
    expect(screen.getByText('Có ít nhất 1 ký tự đặc biệt')).toBeInTheDocument()
    expect(screen.getAllByText(/đã đạt/)).toHaveLength(4)
  })

  it('validates the confirmation field on blur', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(screen.getByLabelText(/M.*t kh.*u/), 'password123')
    await user.type(
      screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/),
      'password124'
    )
    await user.tab()

    expect(
      await screen.findByText('Mật khẩu xác nhận không khớp.')
    ).toBeInTheDocument()
  })

  it('registers successfully and navigates to login', async () => {
    const user = userEvent.setup()

    postMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      }),
    })

    renderRegisterPage()

    await fillRegisterForm(user)

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith(
        '/api/auth/register',
        {
          email: 'test@example.com',
          password: 'password123',
        }
      )
    })

    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  it('shows server error message when register response is not ok', async () => {
    const user = userEvent.setup()

    postMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        message: 'Email đã tồn tại',
      }),
    })

    renderRegisterPage()

    await fillRegisterForm(user, { email: 'existing@example.com' })

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    expect(
      await screen.findByText('Email đã tồn tại')
    ).toBeInTheDocument()

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('shows fallback error when server response has no message', async () => {
    const user = userEvent.setup()

    postMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    })

    renderRegisterPage()

    await fillRegisterForm(user)

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    expect(
      await screen.findByText(/ng k.*th.*b.*i/)
    ).toBeInTheDocument()

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('shows connection error when register request throws', async () => {
    const user = userEvent.setup()

    postMock.mockRejectedValue(new Error('Network error'))

    renderRegisterPage()

    await fillRegisterForm(user)

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    expect(
      await screen.findByText(/Kh.*ng th.* k.*t n.*i.*server/)
    ).toBeInTheDocument()

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('disables register button while request is loading', async () => {
    const user = userEvent.setup()

    let resolveRegister!: (value: unknown) => void

    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve
    })

    postMock.mockReturnValue(registerPromise)

    renderRegisterPage()

    await fillRegisterForm(user)

    const registerButton = screen.getByRole('button', {
      name: /ng k/,
    })

    await user.click(registerButton)

    expect(registerButton).toBeDisabled()
    expect(registerButton).toHaveAttribute('aria-busy', 'true')
    expect(registerButton).toHaveTextContent(/ang.*ng k/)

    resolveRegister({
      ok: false,
      json: vi.fn().mockResolvedValue({
        message: 'Register failed',
      }),
    })

    await waitFor(() => {
      expect(registerButton).not.toBeDisabled()
    })
  })

  it('focuses the summary when several fields are invalid', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.click(screen.getByRole('button', { name: /ng k/ }))

    const summary = await screen.findByRole('alert')

    expect(
      screen.getByText('Vui lòng kiểm tra lại thông tin')
    ).toBeInTheDocument()
    await waitFor(() => expect(summary).toHaveFocus())
    expect(postMock).not.toHaveBeenCalled()
  })

  it('navigates to login page when login button is clicked', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.click(
      screen.getByRole('button', { name: /ng nh.*p/ })
    )

    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  describe('Google Authentication Flow', () => {
    let mockInitialize: ReturnType<typeof vi.fn>
    let mockRenderButton: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockInitialize = vi.fn()
      mockRenderButton = vi.fn().mockImplementation((container: HTMLElement) => {
        container.innerHTML = '<button aria-label="Tiếp tục bằng tài khoản Google">Google</button>'
      })

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

      resetGoogleAuthStateForTesting()
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com')
    })

    it('renders Google sign-up container and calls renderButton with GIS config', async () => {
      renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 'test-client-id.apps.googleusercontent.com',
            callback: expect.any(Function),
          })
        )
        expect(mockRenderButton).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signup_with',
          })
        )
      })
      expect(screen.getByTestId('google-signin-button')).toBeInTheDocument()
    })

    it('does not call initialize multiple times when re-rendered or remounted with same client ID', async () => {
      const { unmount } = renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledTimes(1)
      })

      unmount()
      renderRegisterPage()
      await waitFor(() => {
        expect(mockRenderButton).toHaveBeenCalledTimes(2)
      })
      expect(mockInitialize).toHaveBeenCalledTimes(1)
    })

    it('completes successful Google sign-up: sends credential, sets user, clears messages, loads chats, and redirects to /chat', async () => {
      const clearAllSpy = vi.spyOn(useMessageStore.getState(), 'clearAll')

      let capturedCallback: ((response: { credential?: string }) => Promise<void>) | null = null
      mockInitialize.mockImplementation((opts: any) => {
        capturedCallback = opts.callback
      })

      postMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Đăng ký tài khoản Google thành công',
          user: {
            id: 'google-registered-user-id',
            email: 'newbie@example.com',
            createdAt: '2026-07-01T00:00:00.000Z',
          },
        }),
      })

      getChatsMock.mockResolvedValueOnce([])

      renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled()
      })

      expect(capturedCallback).toBeTypeOf('function')

      await capturedCallback!({ credential: 'mocked-register-jwt-id-token' })

      await waitFor(() => {
        expect(postMock).toHaveBeenCalledWith('/api/auth/google', {
          credential: 'mocked-register-jwt-id-token',
        })
        expect(setUserMock).toHaveBeenCalledWith({
          id: 'google-registered-user-id',
          email: 'newbie@example.com',
          createdAt: '2026-07-01T00:00:00.000Z',
        })
        expect(clearAllSpy).toHaveBeenCalled()
        expect(getChatsMock).toHaveBeenCalled()
        expect(setChatsMock).toHaveBeenCalledWith([])
        expect(setCurrentChatIdMock).toHaveBeenCalledWith(null)
        expect(navigateMock).toHaveBeenCalledWith('/chat')
      })
    })

    it('surfaces safe conflict error (409) when email already registered with password', async () => {
      let capturedCallback: ((response: { credential?: string }) => Promise<void>) | null = null
      mockInitialize.mockImplementation((opts: any) => {
        capturedCallback = opts.callback
      })

      postMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message:
            'Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu hiện tại (tính năng liên kết tài khoản hiện chưa khả dụng).',
        }),
      })

      renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled()
      })

      await capturedCallback!({ credential: 'conflict-id-token' })

      expect(
        await screen.findByText(/Email này đã được đăng ký bằng mật khẩu/i)
      ).toBeInTheDocument()
      expect(setUserMock).not.toHaveBeenCalled()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('handles missing credential in Google response gracefully', async () => {
      let capturedCallback: ((response: { credential?: string }) => Promise<void>) | null = null
      mockInitialize.mockImplementation((opts: any) => {
        capturedCallback = opts.callback
      })

      renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled()
      })

      await capturedCallback!({})

      expect(
        await screen.findByText(/Không nhận được token xác thực từ Google/i)
      ).toBeInTheDocument()
      expect(postMock).not.toHaveBeenCalled()
    })

    it('handles network / connection error gracefully', async () => {
      let capturedCallback: ((response: { credential?: string }) => Promise<void>) | null = null
      mockInitialize.mockImplementation((opts: any) => {
        capturedCallback = opts.callback
      })

      postMock.mockRejectedValueOnce(new Error('Network connection failed'))

      renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled()
      })

      await capturedCallback!({ credential: 'fail-token' })

      expect(await screen.findByText('Network connection failed')).toBeInTheDocument()
    })

    it('does not update state or navigate if callback fires after component unmount', async () => {
      let capturedCallback: ((response: { credential?: string }) => Promise<void>) | null = null
      mockInitialize.mockImplementation((opts: any) => {
        capturedCallback = opts.callback
      })

      const { unmount } = renderRegisterPage()
      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled()
      })

      unmount()

      await capturedCallback!({ credential: 'post-unmount-token' })

      expect(postMock).not.toHaveBeenCalled()
      expect(setUserMock).not.toHaveBeenCalled()
      expect(navigateMock).not.toHaveBeenCalled()
    })
  })
})
