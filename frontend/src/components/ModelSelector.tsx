import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '../stores/aiStore'
import { getAIModels } from '../services/aiService'

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

const EMPTY_MODELS: never[] = []

function ModelSelector() {
  const rawModels = useAIStore((state) => state.models)
  const models = rawModels ?? EMPTY_MODELS
  const setModels = useAIStore((state) => state.setModels)
  const selectedModelId = useAIStore((state) => state.selectedModelId)
  const setSelectedModelId = useAIStore((state) => state.setSelectedModelId)

  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const focusedIndexRef = useRef<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Đồng bộ focusedIndexRef khi focusedIndex thay đổi
  const updateFocusedIndex = (index: number) => {
    focusedIndexRef.current = index
    setFocusedIndex(index)
    if (index >= 0 && optionRefs.current[index]) {
      optionRefs.current[index]?.focus()
    }
  }

  // Tự động khôi phục / tải danh sách models nếu store chưa có (ngăn ngừa biến mất khi tải trang)
  useEffect(() => {
    if (models.length === 0) {
      let isMounted = true
      getAIModels()
        .then((fetched) => {
          if (!isMounted) return
          if (Array.isArray(fetched) && fetched.length > 0) {
            setModels(fetched)
            const currentSelected = useAIStore.getState().selectedModelId
            const activeModel = fetched.find(
              (m) => m.id === currentSelected && m.available !== false
            )
            if (!activeModel) {
              const firstAvail = fetched.find((m) => m.available !== false) || fetched[0]
              if (firstAvail) {
                setSelectedModelId(firstAvail.id)
              }
            }
          }
        })
        .catch((err) => {
          console.error('Không thể tải danh sách AI model:', err)
        })

      return () => {
        isMounted = false
      }
    }
  }, [models.length, setModels, setSelectedModelId])

  const modelsRef = useRef(models)
  const selectedModelIdRef = useRef(selectedModelId)

  useEffect(() => {
    modelsRef.current = models
    selectedModelIdRef.current = selectedModelId
  }, [models, selectedModelId])

  // Quản lý tiêu điểm bàn phím khi mở dropdown (Roving Tabindex)
  useEffect(() => {
    if (isOpen) {
      const currentModels = modelsRef.current
      const currentSelected = selectedModelIdRef.current
      const currentIndex = currentModels.findIndex(
        (m) => m.id === currentSelected && m.available !== false
      )
      const initialIndex =
        currentIndex !== -1
          ? currentIndex
          : currentModels.findIndex((m) => m.available !== false)
      const validIndex = initialIndex !== -1 ? initialIndex : 0
      focusedIndexRef.current = validIndex
      setFocusedIndex(validIndex)
    } else {
      focusedIndexRef.current = -1
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Xử lý đóng dropdown khi click bên ngoài hoặc bấm Escape toàn cục
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isOpen])

  if (models.length === 0) {
    return null
  }

  const selectedModel =
    models.find((model) => model.id === selectedModelId && model.available !== false) ||
    models.find((model) => model.available !== false) ||
    models.find((model) => model.id === selectedModelId) ||
    models[0]

  const handleSelectModel = (modelId: string, event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    const targetModel = models.find((model) => model.id === modelId)
    if (targetModel && targetModel.available === false) {
      return
    }
    setSelectedModelId(modelId)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Điều hướng bàn phím theo WAI-ARIA Listbox Pattern
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        handleDropdownKeyDown(e)
      }
      return
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'Tab' && isOpen) {
      setIsOpen(false)
      return
    }
  }

  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
      return
    }

    if (e.key === 'Tab') {
      setIsOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const current = focusedIndexRef.current
      let nextIndex = current + 1
      while (nextIndex < models.length && models[nextIndex].available === false) {
        nextIndex++
      }
      if (nextIndex < models.length) {
        updateFocusedIndex(nextIndex)
      } else {
        const firstAvail = models.findIndex((m) => m.available !== false)
        if (firstAvail !== -1) updateFocusedIndex(firstAvail)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const current = focusedIndexRef.current
      let prevIndex = current - 1
      while (prevIndex >= 0 && models[prevIndex].available === false) {
        prevIndex--
      }
      if (prevIndex >= 0) {
        updateFocusedIndex(prevIndex)
      } else {
        for (let i = models.length - 1; i >= 0; i--) {
          if (models[i].available !== false) {
            updateFocusedIndex(i)
            break
          }
        }
      }
      return
    }

    if (e.key === 'Home') {
      e.preventDefault()
      const firstAvail = models.findIndex((m) => m.available !== false)
      if (firstAvail !== -1) updateFocusedIndex(firstAvail)
      return
    }

    if (e.key === 'End') {
      e.preventDefault()
      for (let i = models.length - 1; i >= 0; i--) {
        if (models[i].available !== false) {
          updateFocusedIndex(i)
          break
        }
      }
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const current = focusedIndexRef.current
      if (current >= 0 && current < models.length) {
        const targetModel = models[current]
        if (targetModel && targetModel.available !== false) {
          handleSelectModel(targetModel.id)
        }
      }
      return
    }
  }

  return (
    <div
      ref={containerRef}
      data-testid="model-selector"
      className="relative flex items-center gap-1.5 z-50"
    >
      {/* Trigger Button: Standardized 36px height (h-9) with AI accent */}
      <button
        ref={triggerRef}
        type="button"
        id="model-selector-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="model-selector-listbox"
        aria-label={`Mô hình AI hiện tại: ${selectedModel?.name ?? 'Chọn model'}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className="group flex h-9 items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#1A2230] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#F1F5F9] shadow-xs transition-all duration-150 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-[#222C3D] active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#15803D] dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923] focus-visible:outline-none"
      >
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center text-[#15803D] dark:text-emerald-400 font-bold select-none"
          aria-hidden="true"
        >
          ✦
        </span>
        <span className="hidden sm:inline text-xs font-normal text-slate-500 dark:text-[#94A3B8] select-none">
          Model:
        </span>
        <span className="max-w-[110px] sm:max-w-[150px] truncate font-semibold text-slate-900 dark:text-[#F1F5F9]">
          {selectedModel?.name ?? 'Chọn model'}
        </span>
        <svg
          className={`h-3 w-3 text-slate-400 dark:text-[#94A3B8] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-[#F1F5F9]' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accessible native select for screen readers and automated test suites */}
      <select
        id="model-selector"
        aria-label="Model"
        value={selectedModelId ?? ''}
        onChange={(event) => {
          const target = models.find((m) => m.id === event.target.value)
          if (target && target.available === false) {
            return
          }
          setSelectedModelId(event.target.value)
        }}
        className="sr-only"
        tabIndex={-1}
      >
        {models.map((model) => (
          <option
            key={model.id}
            value={model.id}
            disabled={model.available === false}
          >
            {model.name}
          </option>
        ))}
      </select>

      {/* Custom Dropdown Menu with Unified Surface Token (Pure Roving Tabindex) */}
      {isOpen && (
        <div
          id="model-selector-listbox"
          role="listbox"
          tabIndex={-1}
          aria-labelledby="model-selector-btn"
          onKeyDown={handleDropdownKeyDown}
          className="absolute right-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-4.5rem)] sm:w-80 sm:max-w-none rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#1A2230] p-2 shadow-2xl shadow-black/10 dark:shadow-black/60 backdrop-blur-xl animate-dropdown-fade space-y-1 focus:outline-none"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-white/[0.06] mb-1 select-none">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Mô hình AI
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#15803D] dark:text-emerald-400 border border-emerald-500/20">
              {models.filter((m) => m.available !== false).length} khả dụng
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-1 scrollbar-thin">
            {models.map((model, index) => {
              const isAvailable = model.available !== false
              const isSelected = model.id === (selectedModelId ?? models[0]?.id)
              const isKeyboardFocused = focusedIndex === index
              const meta = MODEL_META[model.id] ?? {
                subtitle: model.provider ? `${model.provider} · ${model.model}` : 'Mô hình AI',
                iconBg: 'bg-emerald-500/20 border border-emerald-500/40',
                iconColor: 'text-emerald-400',
                icon: '✦',
              }

              return (
                <button
                  key={model.id}
                  ref={(el) => {
                    optionRefs.current[index] = el
                  }}
                  id={`model-option-${model.id}`}
                  type="button"
                  role="option"
                  tabIndex={isKeyboardFocused ? 0 : -1}
                  aria-selected={isSelected}
                  aria-disabled={!isAvailable}
                  disabled={!isAvailable}
                  title={!isAvailable ? (model.disabledReason || 'Mô hình không khả dụng trong môi trường này') : undefined}
                  onKeyDown={handleDropdownKeyDown}
                  onMouseEnter={() => {
                    if (isAvailable) {
                      setFocusedIndex(index)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                  }}
                  onClick={(e) => {
                    if (isAvailable) {
                      handleSelectModel(model.id, e)
                    }
                  }}
                  className={`w-full rounded-lg p-2 text-left transition-all duration-150 flex items-center justify-between gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] dark:focus-visible:ring-emerald-400 ${
                    !isAvailable
                      ? 'opacity-40 cursor-not-allowed border border-transparent select-none'
                      : isSelected
                      ? 'border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xs cursor-pointer'
                      : isKeyboardFocused
                      ? 'border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#222C3D] cursor-pointer'
                      : 'border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100/70 dark:hover:bg-[#222C3D]/60 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Icon Badge */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${meta.iconBg} ${meta.iconColor}`}
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`truncate text-xs font-semibold ${
                            !isAvailable
                              ? 'text-slate-400 dark:text-[#64748B]'
                              : isSelected
                              ? 'text-[#15803D] dark:text-emerald-300'
                              : 'text-slate-800 dark:text-[#F1F5F9]'
                          }`}
                        >
                          {model.name}
                        </span>

                        {!isAvailable ? (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-200/90 dark:bg-[#131923] text-slate-700 dark:text-[#94A3B8] border border-slate-300/40 dark:border-white/[0.08]">
                            {model.disabledReason || 'Không khả dụng'}
                          </span>
                        ) : meta.badgeText ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              meta.badgeColor || 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                            }`}
                          >
                            {meta.badgeText}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] truncate mt-0.5">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <svg className="h-4 w-4 text-[#15803D] dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSelector