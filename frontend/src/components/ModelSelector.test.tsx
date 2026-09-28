import { render, screen } from '@testing-library/react'
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
})
