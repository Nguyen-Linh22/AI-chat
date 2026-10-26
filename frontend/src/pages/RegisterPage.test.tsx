import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'

const { postMock, navigateMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../services/apiClient', () => ({
  apiClient: {
    post: postMock,
  },
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
})
