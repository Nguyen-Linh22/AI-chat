import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import ModelSelector from './ModelSelector'

const { useAIStoreMock, setSelectedModelIdMock } = vi.hoisted(() => ({
  useAIStoreMock: vi.fn(),
  setSelectedModelIdMock: vi.fn(),
}))

vi.mock('../stores/aiStore', () => ({
  useAIStore: useAIStoreMock,
}))

vi.mock('../services/aiService', () => ({
  getAIModels: vi.fn().mockResolvedValue([]),
}))

describe('ModelSelector', () => {
  it('should render model options when models are available', () => {
    useAIStoreMock
      .mockImplementationOnce((selector: (state: unknown) => unknown) =>
        selector({
          models: [
            {
              id: 'ollama-qwen3-1.7b',
              name: 'Qwen 3 1.7B',
            },
            {
              id: 'openai-gpt-5-mini',
              name: 'GPT-5 Mini',
            },
          ],
        })
      )
      .mockImplementationOnce((selector: (state: unknown) => unknown) =>
        selector({
          selectedModelId: 'ollama-qwen3-1.7b',
        })
      )
      .mockImplementationOnce((selector: (state: unknown) => unknown) =>
        selector({
          setSelectedModelId: setSelectedModelIdMock,
        })
      )

    render(<ModelSelector />)

    const selector = screen.getByRole('combobox')

    expect(selector).toBeInTheDocument()
    expect(selector).toHaveValue('ollama-qwen3-1.7b')
    expect(
      screen.getByRole('option', { name: 'Qwen 3 1.7B' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'GPT-5 Mini' })
    ).toBeInTheDocument()
  })

  it('should render nothing when there are no models', () => {
    useAIStoreMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          models: [],
          selectedModelId: null,
          setSelectedModelId: setSelectedModelIdMock,
        })
    )

    const { container } = render(<ModelSelector />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should change the selected model when user selects another model', async () => {
    const user = userEvent.setup()

    useAIStoreMock
      .mockImplementationOnce((selector: (state: unknown) => unknown) =>
        selector({
          models: [
            {
              id: 'ollama-qwen3-1.7b',
              name: 'Qwen 3 1.7B',
            },
            {
              id: 'openai-gpt-5-mini',
              name: 'GPT-5 Mini',
            },
          ],
        })
      )
      .mockImplementationOnce((selector: (state: unknown) => unknown) =>
        selector({
          selectedModelId: 'ollama-qwen3-1.7b',
        })
      )
      .mockImplementationOnce((selector: (state: unknown) => unknown) =>
        selector({
          setSelectedModelId: setSelectedModelIdMock,
        })
      )

    render(<ModelSelector />)

    await user.selectOptions(
      screen.getByRole('combobox'),
      'openai-gpt-5-mini'
    )

    expect(setSelectedModelIdMock).toHaveBeenCalledWith(
      'openai-gpt-5-mini'
    )
  })

  it('should change the selected model when clicking custom dropdown option', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'ollama-qwen3-1.7b',
            name: 'Qwen 3 1.7B',
          },
          {
            id: 'openai-gpt-5-mini',
            name: 'GPT-5 Mini',
          },
        ],
        selectedModelId: 'ollama-qwen3-1.7b',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    // Click trigger button to open custom dropdown
    const triggerBtn = screen.getByRole('button', { name: /Qwen 3 1.7B/i })
    await user.click(triggerBtn)

    // Click on custom dropdown GPT-5 Mini option
    const options = screen.getAllByRole('option', { name: /GPT-5 Mini/i })
    await user.click(options[1])

    expect(setSelectedModelIdMock).toHaveBeenCalledWith('openai-gpt-5-mini')
  })

  it('should render unavailable models as disabled, dimmed, and with disabledReason', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
          {
            id: 'ollama-qwen3-1.7b',
            name: 'Qwen 3 1.7B',
            available: false,
            disabledReason: 'Chỉ khả dụng ở môi trường Local',
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    // Check native select has disabled option for Qwen
    const nativeSelect = screen.getByRole('combobox')
    const nativeOptions = nativeSelect.querySelectorAll('option')
    expect(nativeOptions[0]).not.toBeDisabled()
    expect(nativeOptions[1]).toBeDisabled()

    // Open custom dropdown
    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    await user.click(triggerBtn)

    const dropdown = screen.getByRole('listbox')

    // Find custom dropdown option for Qwen
    const disabledOption = within(dropdown).getByRole('option', { name: /Qwen 3 1.7B/i })
    expect(disabledOption).toBeDisabled()
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
    expect(disabledOption.className).toContain('opacity-40')
    expect(disabledOption.className).toContain('cursor-not-allowed')
    expect(screen.getByText('Chỉ khả dụng ở môi trường Local')).toBeInTheDocument()
  })

  it('should not change the selected model when clicking a disabled model option', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
          {
            id: 'openai-gpt-5-mini',
            name: 'GPT-5 Mini',
            available: false,
            disabledReason: 'Chưa cấu hình OpenAI API key',
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    // Open custom dropdown
    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    await user.click(triggerBtn)

    const dropdown = screen.getByRole('listbox')

    // Attempt to click disabled GPT-5 Mini option
    const disabledOption = within(dropdown).getByRole('option', { name: /GPT-5 Mini/i })
    await user.click(disabledOption)

    expect(setSelectedModelIdMock).not.toHaveBeenCalled()
  })

  it('should support full keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
          {
            id: 'ollama-qwen3-1.7b',
            name: 'Qwen 3 1.7B',
            available: true,
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    expect(triggerBtn).toHaveAttribute('aria-haspopup', 'listbox')
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
    expect(triggerBtn).toHaveAttribute('aria-controls', 'model-selector-listbox')

    // Open dropdown via ArrowDown key on trigger button
    triggerBtn.focus()
    await user.keyboard('{ArrowDown}')

    expect(triggerBtn).toHaveAttribute('aria-expanded', 'true')
    const dropdown = screen.getByRole('listbox')
    expect(dropdown).toBeInTheDocument()

    // Navigate to next option via ArrowDown
    await user.keyboard('{ArrowDown}')

    // Select with Enter key
    await user.keyboard('{Enter}')

    expect(setSelectedModelIdMock).toHaveBeenCalledWith('ollama-qwen3-1.7b')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should close dropdown and return focus on Escape key', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    await user.click(triggerBtn)

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Press Escape
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('should verify pure Roving Tabindex ARIA attributes and focus-visible indicators', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
          {
            id: 'openai-gpt-5-mini',
            name: 'GPT-5 Mini',
            available: true,
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    expect(triggerBtn.className).toContain('focus-visible:ring-[#15803D]')
    expect(triggerBtn.className).toContain('dark:focus-visible:ring-emerald-400')

    await user.click(triggerBtn)

    const listbox = screen.getByRole('listbox')
    // Pure Roving Tabindex: container MUST NOT have aria-activedescendant
    expect(listbox).not.toHaveAttribute('aria-activedescendant')
    expect(listbox).toHaveAttribute('aria-labelledby', 'model-selector-btn')

    const options = screen.getAllByRole('option')
    const customOption1 = options[2] // custom dropdown first option
    const customOption2 = options[3] // custom dropdown second option

    // Roving tabindex: focused item has tabIndex=0, other has tabIndex=-1
    expect(customOption1).toHaveAttribute('tabindex', '0')
    expect(customOption2).toHaveAttribute('tabindex', '-1')
    expect(customOption1.className).toContain('focus-visible:ring-[#15803D]')
    expect(customOption1.className).toContain('dark:focus-visible:ring-emerald-400')
  })

  it('should support Home, End, ArrowUp navigation and Space key selection while skipping disabled models', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'm1-gemini',
            name: 'Gemini 3.6',
            available: true,
          },
          {
            id: 'm2-disabled',
            name: 'Disabled Model',
            available: false,
            disabledReason: 'Bảo trì',
          },
          {
            id: 'm3-gpt',
            name: 'GPT-5 Mini',
            available: true,
          },
        ],
        selectedModelId: 'm1-gemini',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6/i })
    triggerBtn.focus()

    // Open via Enter on trigger
    await user.keyboard('{Enter}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Press ArrowDown: should skip m2-disabled and jump to m3-gpt
    await user.keyboard('{ArrowDown}')

    // Jump to Home (m1-gemini)
    await user.keyboard('{Home}')

    // Jump to End (m3-gpt)
    await user.keyboard('{End}')

    // Select with Space key
    await user.keyboard(' ')

    expect(setSelectedModelIdMock).toHaveBeenCalledWith('m3-gpt')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should close dropdown without trapping focus on Tab key', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    await user.click(triggerBtn)

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Press Tab: closes dropdown naturally without trapping
    await user.keyboard('{Tab}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('should include responsive max-width classes on dropdown to prevent overflow on small viewports', async () => {
    const user = userEvent.setup()

    useAIStoreMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        models: [
          {
            id: 'gemini-3.6-flash',
            name: 'Gemini 3.6 Flash',
            available: true,
          },
        ],
        selectedModelId: 'gemini-3.6-flash',
        setSelectedModelId: setSelectedModelIdMock,
      })
    )

    render(<ModelSelector />)

    const triggerBtn = screen.getByRole('button', { name: /Gemini 3.6 Flash/i })
    await user.click(triggerBtn)

    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()
    expect(listbox.className).toContain('max-w-[calc(100vw-4.5rem)]')
    expect(listbox.className).toContain('sm:max-w-none')
    expect(listbox.className).toContain('sm:w-80')
  })
})
