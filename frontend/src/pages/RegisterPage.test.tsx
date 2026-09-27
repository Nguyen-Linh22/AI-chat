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

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText(/M.*t kh.*u/)
    const confirmPasswordInput = screen.getByLabelText(
      /X.*c nh.*n m.*t kh.*u/
    )

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
    expect(confirmPasswordInput).toHaveValue('password123')
  })

  it('shows error and does not call API when passwords do not match', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(
      screen.getByLabelText('Email'),
      'test@example.com'
    )

    await user.type(
      screen.getByLabelText(/M.*t kh.*u/),
      'password123'
    )

    await user.type(
      screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/),
      'different-password'
    )

    await user.click(
      screen.getByRole('button', { name: /ng k/ })
    )

    expect(
      await screen.findByText(/M.*t kh.*u x.*c nh.*n kh.*ng kh.*p/)
    ).toBeInTheDocument()

    expect(postMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
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

    await user.type(
      screen.getByLabelText('Email'),
      'test@example.com'
    )

    await user.type(
      screen.getByLabelText(/M.*t kh.*u/),
      'password123'
    )

    await user.type(
      screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/),
      'password123'
    )

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

    await user.type(
      screen.getByLabelText('Email'),
      'existing@example.com'
    )

    await user.type(
      screen.getByLabelText(/M.*t kh.*u/),
      'password123'
    )

    await user.type(
      screen.getByLabelText(/X.*c nh.*n m.*t kh.*u/),
      'password123'
    )

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

    const registerButton = screen.getByRole('button', {
      name: /ng k/,
    })

    await user.click(registerButton)

    expect(registerButton).toBeDisabled()
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

  it('navigates to login page when login button is clicked', async () => {
    const user = userEvent.setup()

    renderRegisterPage()

    await user.click(
      screen.getByRole('button', { name: /ng nh.*p/ })
    )

    expect(navigateMock).toHaveBeenCalledWith('/login')
  })
})
