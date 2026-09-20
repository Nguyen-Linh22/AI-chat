import { useAIStore } from '../stores/aiStore'

function ModelSelector() {
  const models = useAIStore(
    (state) => state.models
  )

  const selectedModelId = useAIStore(
    (state) => state.selectedModelId
  )

  const setSelectedModelId = useAIStore(
    (state) => state.setSelectedModelId
  )

  if (models.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="model-selector"
        className="text-sm text-gray-400"
      >
        Model:
      </label>

      <select
        id="model-selector"
        value={selectedModelId ?? ''}
        onChange={(event) => {
          setSelectedModelId(event.target.value)
        }}
        className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      >
        {models.map((model) => (
          <option
            key={model.id}
            value={model.id}
          >
            {model.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ModelSelector