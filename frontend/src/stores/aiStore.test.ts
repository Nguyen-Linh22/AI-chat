import { describe, it, expect, beforeEach } from 'vitest'
import { useAIStore } from './aiStore'

describe('aiStore', () => {
  beforeEach(() => {
    useAIStore.setState({
      models: [],
      selectedModelId: null,
    })
  })

  it('should have the correct initial state', () => {
    const state = useAIStore.getState()

    expect(state.models).toEqual([])
    expect(state.selectedModelId).toBeNull()
  })

  it('should set the models', () => {
    const models = [
      {
        id: 'ollama-qwen3-1.7b',
        name: 'Qwen 3 1.7B',
        provider: 'ollama',
        model: 'qwen3:1.7b',
      },
      {
        id: 'openai-gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'openai',
        model: 'gpt-5-mini',
      },
    ]

    useAIStore.getState().setModels(models)

    expect(useAIStore.getState().models).toEqual(models)
  })

  it('should set the selected model id', () => {
    useAIStore.getState().setSelectedModelId('ollama-qwen3-1.7b')

    expect(
      useAIStore.getState().selectedModelId
    ).toBe('ollama-qwen3-1.7b')

    useAIStore.getState().setSelectedModelId('openai-gpt-5-mini')

    expect(
      useAIStore.getState().selectedModelId
    ).toBe('openai-gpt-5-mini')
  })

  it('should clear the selected model id', () => {
    useAIStore.getState().setSelectedModelId('ollama-qwen3-1.7b')

    expect(
      useAIStore.getState().selectedModelId
    ).toBe('ollama-qwen3-1.7b')

    useAIStore.getState().setSelectedModelId(null as any)

    expect(
      useAIStore.getState().selectedModelId
    ).toBeNull()
  })
})
