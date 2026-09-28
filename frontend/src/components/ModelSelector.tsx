import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '../stores/aiStore'

interface ModelVisualMeta {
  subtitle: string
  badgeText?: string
  badgeColor?: string
  iconBg: string
  iconColor: string
  icon: string
  titleColor?: string
}

const MODEL_META: Record<string, ModelVisualMeta> = {
  'ollama-qwen3-1.7b': {
    subtitle: 'Nhanh chóng, hiệu quả',
    iconBg: 'bg-teal-500/20 border border-teal-500/40',
    iconColor: 'text-teal-300',
    icon: '❄',
    titleColor: 'text-amber-300',
  },
  'openai-gpt-5-mini': {
    subtitle: 'Thông minh hơn, sâu sắc hơn',
    iconBg: 'bg-white/10 border border-white/20',
    iconColor: 'text-white',
    icon: '◎',
  },
  'gemini-3.6-flash': {
    subtitle: 'Tối ưu cho sáng tạo',
    badgeText: 'Tạo ưu',
    badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-500/40',
    iconBg: 'bg-purple-500/20 border border-purple-500/40',
    iconColor: 'text-purple-300',
    icon: '✦',
  },
  'groq-gpt-oss-20b': {
    subtitle: 'Mã nguồn mở mạnh mẽ',
    badgeText: 'Sáng',
    badgeColor: 'bg-amber-900/60 text-amber-300 border border-amber-500/40',
    iconBg: 'bg-orange-500/20 border border-orange-500/40',
    iconColor: 'text-orange-400',
    icon: 'Q',
  },
}

function ModelSelector() {
  const models = useAIStore((state) => state.models)
  const selectedModelId = useAIStore((state) => state.selectedModelId)
  const setSelectedModelId = useAIStore((state) => state.setSelectedModelId)

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (models.length === 0) {
    return null
  }

  const selectedModel =
    models.find((model) => model.id === selectedModelId) || models[0]

  const handleSelectModel = (modelId: string, event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setSelectedModelId(modelId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 z-50">
      <span className="text-xs font-normal text-slate-500 dark:text-gray-400 select-none">
        Model:
      </span>

      {/* Trigger Button Matching Screenshot Pill Style */}
      <button
        type="button"
        id="model-selector-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 px-3 py-1 text-xs font-medium text-slate-700 dark:text-gray-200 shadow-xs dark:shadow-sm backdrop-blur-md transition-all duration-150 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-[#1a2332] active:scale-[0.98] cursor-pointer"
      >
        <span className="max-w-[120px] sm:max-w-[160px] truncate font-medium">
          {selectedModel?.name ?? 'Chọn model'}
        </span>
        <span
          className={`text-[9px] text-slate-400 dark:text-gray-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-gray-200' : ''
          }`}
          aria-hidden="true"
        >
          ∨
        </span>
      </button>

      {/* Accessible native select for screen readers and automated test suites */}
      <select
        id="model-selector"
        aria-label="Model"
        value={selectedModelId ?? ''}
        onChange={(event) => {
          setSelectedModelId(event.target.value)
        }}
        className="sr-only"
        tabIndex={-1}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>

      {/* Custom Dropdown Menu Visually Matching Screenshot */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="model-selector-btn"
          className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#151c27]/95 p-2 shadow-xl dark:shadow-2xl backdrop-blur-2xl animate-dropdown-fade space-y-1.5"
        >
          {models.map((model) => {
            const isSelected = model.id === (selectedModelId ?? models[0]?.id)
            const meta = MODEL_META[model.id] ?? {
              subtitle: model.provider ? `${model.provider} · ${model.model}` : 'Mô hình AI',
              iconBg: 'bg-emerald-500/20 border border-emerald-500/40',
              iconColor: 'text-emerald-400',
              icon: '✦',
            }

            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => handleSelectModel(model.id, e)}
                onClick={(e) => handleSelectModel(model.id, e)}
                className={`w-full rounded-xl p-2.5 text-left transition-all duration-150 flex items-center justify-between gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'border border-amber-400/90 bg-amber-50/50 dark:bg-white/[0.04] shadow-xs dark:shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                    : 'border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Icon Badge */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${meta.iconBg} ${meta.iconColor}`}
                  >
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`truncate text-xs font-semibold ${
                          isSelected
                            ? meta.titleColor || 'text-amber-600 dark:text-amber-300'
                            : 'text-slate-800 dark:text-gray-100'
                        }`}
                      >
                        {model.name}
                      </span>

                      {meta.badgeText && (
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-medium ${
                            meta.badgeColor || 'bg-purple-900/60 text-purple-300'
                          }`}
                        >
                          {meta.badgeText}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-amber-400 text-xs shrink-0 font-bold">
                    ★
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ModelSelector