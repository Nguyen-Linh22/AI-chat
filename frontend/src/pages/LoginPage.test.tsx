import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

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

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email = 'test@example.com',
  password = 'password123'
) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText(/M.*t kh.*u/), password)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    renderLoginPage()

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText(/M.*t kh.*u/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ng nh.*p/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ng k/ })
    ).toBeInTheDocument()
  })

  it('updates email and password inputs', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText(/M.*t kh.*u/)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('logs in successfully, loads chats, updates stores, and navigates to chat', async () => {
    const user = userEvent.setup()

    const userData = {
      id: 'user-1',
      email: 'test@example.com',
    }

    const chats = [
      {
        id: 'chat-1',
        title: 'Test chat',
      },
    ]

    postMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        user: userData,
      }),
    })

    getChatsMock.mockResolvedValue(chats)

    renderLoginPage()

    await fillCredentials(user)

    await user.click(
      screen.getByRole('button', { name: /ng nh.*p/ })
    )

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith(
        '/api/auth/login',
        {
          email: 'test@example.com',
          password: 'password123',
        }
      )
    })

    expect(setUserMock).toHaveBeenCalledWith(userData)
    expect(getChatsMock).toHaveBeenCalledTimes(1)
    expect(setChatsMock).toHaveBeenCalledWith(chats)
    expect(setCurrentChatIdMock).toHaveBeenCalledWith(null)
    expect(navigateMock).toHaveBeenCalledWith('/chat')
  })

  it('shows server error message when login response is not ok', async () => {
    const user = userEvent.setup()

    postMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        message: 'Email hoặc mật khẩu không đúng',
      }),
    })

    renderLoginPage()

    await fillCredentials(user, 'wrong@example.com', 'wrong-password')

    await user.click(
      screen.getByRole('button', { name: /ng nh.*p/ })
    )

    expect(
      await screen.findByText('Email hoặc mật khẩu không đúng')
    ).toBeInTheDocument()

    expect(navigateMock).not.toHaveBeenCalled()
    expect(setUserMock).not.toHaveBeenCalled()
    expect(getChatsMock).not.toHaveBeenCalled()
  })

  it('shows fallback error when server response has no message', async () => {
    const user = userEvent.setup()

    postMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    })

    renderLoginPage()

    await fillCredentials(user)

    await user.click(
      screen.getByRole('button', { name: /ng nh.*p/ })
    )

    expect(
      await screen.findByText(/ng nh.*p th.*b.*i/)
    ).toBeInTheDocument()

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('shows connection error when login request throws', async () => {
    const user = userEvent.setup()

    postMock.mockRejectedValue(new Error('Network error'))

    renderLoginPage()

    await fillCredentials(user)

    await user.click(
      screen.getByRole('button', { name: /ng nh.*p/ })
    )

    expect(
      await screen.findByText(/Kh.*ng th.* k.*t n.*i.*server/)
    ).toBeInTheDocument()

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('disables login button while request is loading', async () => {
    const user = userEvent.setup()

    let resolveLogin!: (value: unknown) => void

    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })

    postMock.mockReturnValue(loginPromise)

    renderLoginPage()

    await fillCredentials(user)

    const loginButton = screen.getByRole('button', {
      name: /ng nh.*p/,
    })

    await user.click(loginButton)

    expect(loginButton).toBeDisabled()
    expect(loginButton).toHaveAttribute('aria-busy', 'true')
    expect(loginButton).toHaveTextContent(/ang.*ng nh.*p/)

    resolveLogin({
      ok: false,
      json: vi.fn().mockResolvedValue({
        message: 'Login failed',
      }),
    })

    await waitFor(() => {
      expect(loginButton).not.toBeDisabled()
    })
  })

  it('navigates to register page when register button is clicked', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    expect(navigateMock).toHaveBeenCalledWith('/register')
  })

  it('shows inline errors, a summary, and skips the API for an empty submit', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /ng nh.*p/ }))

    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()
    expect(
      screen.getByText('Vui lòng kiểm tra lại thông tin')
    ).toBeInTheDocument()

    expect(postMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('marks fields invalid with aria-invalid and aria-describedby', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /ng nh.*p/ }))

    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(emailInput.getAttribute('aria-describedby')).toContain('email-error')
  })

  it('validates the email format on blur', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'not-an-email')
    await user.tab()

    expect(await screen.findByText('Email không hợp lệ.')).toBeInTheDocument()
    expect(postMock).not.toHaveBeenCalled()
  })

  it('focuses the error summary, and its links focus the invalid field', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /ng nh.*p/ }))

    const summary = await screen.findByRole('alert')
    await waitFor(() => expect(summary).toHaveFocus())

    await user.click(screen.getByRole('button', { name: 'Email' }))

    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('toggles password visibility with an accessible pressed state', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    const toggle = screen.getByRole('button', { name: 'Hiện mật khẩu' })
    const passwordInput = screen.getByLabelText(/M.*t kh.*u/)

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Ẩn mật khẩu' })
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
