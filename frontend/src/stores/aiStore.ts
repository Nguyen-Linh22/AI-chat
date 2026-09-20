import { create } from 'zustand'
import type { AIModel } from '../services/aiService'

interface AIState {
  models: AIModel[]
  selectedModelId: string | null

  setModels: (models: AIModel[]) => void
  setSelectedModelId: (modelId: string) => void
}

export const useAIStore = create<AIState>((set) => ({
  models: [],
  selectedModelId: null,

  setModels: (models) =>
    set({
      models
    }),

  setSelectedModelId: (modelId) =>
    set({
      selectedModelId: modelId
    })
}))