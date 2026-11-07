import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '../stores/aiStore'
import { getAIModels } from '../services/aiService'
import './ModelSelector.css'
import geminiLogo from '../assets/models/gemini.webp'
import ollamaLogo from '../assets/models/ollama.webp'
import chatgptLogo from '../assets/models/chatgpt.webp'
import groqLogo from '../assets/models/groq.webp'

interface ModelVisualMeta {
  subtitle: string
  providerName?: string
  badgeText?: string
  badgeColor?: string
  iconBg: string
  iconColor: string
  icon: string
  logo?: string
  fallbackLogo?: string
  titleColor?: string
}

const MODEL_META: Record<string, ModelVisualMeta> = {
  'ollama-qwen3-1.7b': {
    subtitle: 'Nhanh chóng, cục bộ & riêng tư',
    providerName: 'Ollama',
    iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
    iconColor: 'text-teal-600 dark:text-teal-300',
    icon: '❄',
    logo: ollamaLogo,
    fallbackLogo: 'https://zonalogo.com/assets/ollama-logo-png-svg.webp',
    titleColor: 'text-teal-700 dark:text-teal-300',
  },
  'openai-gpt-5-mini': {
    subtitle: 'Thông minh hơn, suy luận sâu sắc',
    providerName: 'OpenAI',
    iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
    iconColor: 'text-slate-800 dark:text-white',
    icon: '◎',
    logo: chatgptLogo,
    fallbackLogo: 'https://zonalogo.com/assets/chatgpt-logo.webp?asset=947',
  },
  'gemini-3.6-flash': {
    subtitle: 'Tốc độ cao, tối ưu sáng tạo đa thể thức',
    providerName: 'Google',
    badgeText: 'Tạo ưu',
    badgeColor: 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-500/40',
    iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
    iconColor: 'text-purple-600 dark:text-purple-300',
    icon: '✦',
    logo: geminiLogo,
    fallbackLogo: 'https://zonalogo.com/assets/logo-google-gemini.webp?asset=777',
  },
  'groq-gpt-oss-20b': {
    subtitle: 'Mã nguồn mở suy luận siêu tốc LPU',
    providerName: 'Groq',
    badgeText: 'Sáng',
    badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-500/40',
    iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
    iconColor: 'text-orange-600 dark:text-orange-400',
    icon: '⚡',
    logo: groqLogo,
    fallbackLogo: 'https://zonalogo.com/assets/groq-logo-png-svg.webp?asset=5226',
  },
}

function resolveModelMeta(model?: { id?: string; name?: string; provider?: string; model?: string } | null): ModelVisualMeta {
  if (!model?.id) {
    return {
      subtitle: 'Mô hình AI',
      iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: '✦',
    }
  }

  if (MODEL_META[model.id]) {
    return MODEL_META[model.id]
  }

  const idLower = (model.id || '').toLowerCase()
  const providerLower = (model.provider || '').toLowerCase()

  if (idLower.includes('gemini') || providerLower.includes('gemini') || providerLower.includes('google')) {
    return {
      subtitle: model.provider ? `${model.provider} · ${model.model || model.name}` : 'Mô hình Google Gemini',
      providerName: 'Google',
      badgeText: 'Tạo ưu',
      badgeColor: 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-500/40',
      iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
      iconColor: 'text-purple-600 dark:text-purple-300',
      icon: '✦',
      logo: geminiLogo,
      fallbackLogo: 'https://zonalogo.com/assets/logo-google-gemini.webp?asset=777',
    }
  }

  if (idLower.includes('gpt') || idLower.includes('openai') || providerLower.includes('openai')) {
    return {
      subtitle: model.provider ? `${model.provider} · ${model.model || model.name}` : 'Mô hình OpenAI ChatGPT',
      providerName: 'OpenAI',
      iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
      iconColor: 'text-slate-800 dark:text-white',
      icon: '◎',
      logo: chatgptLogo,
      fallbackLogo: 'https://zonalogo.com/assets/chatgpt-logo.webp?asset=947',
    }
  }

  if (idLower.includes('ollama') || idLower.includes('qwen') || providerLower.includes('ollama')) {
    return {
      subtitle: model.provider ? `${model.provider} · ${model.model || model.name}` : 'Mô hình Ollama Local',
      providerName: 'Ollama',
      iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
      iconColor: 'text-teal-600 dark:text-teal-300',
      icon: '❄',
      logo: ollamaLogo,
      fallbackLogo: 'https://zonalogo.com/assets/ollama-logo-png-svg.webp',
      titleColor: 'text-teal-700 dark:text-teal-300',
    }
  }

  if (idLower.includes('groq') || providerLower.includes('groq')) {
    return {
      subtitle: model.provider ? `${model.provider} · ${model.model || model.name}` : 'Mô hình Groq LPU',
      providerName: 'Groq',
      badgeText: 'Sáng',
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-500/40',
      iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
      iconColor: 'text-orange-600 dark:text-orange-400',
      icon: '⚡',
      logo: groqLogo,
      fallbackLogo: 'https://zonalogo.com/assets/groq-logo-png-svg.webp?asset=5226',
    }
  }

  return {
    subtitle: model.provider ? `${model.provider} · ${model.model || model.name}` : 'Mô hình AI',
    iconBg: 'bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/15',
    iconColor: 'text-amber-600 dark:text-indigo-400 zyricon:text-[#C27595]',
    icon: '✦',
  }
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

  // Tự động khôi phục / tải danh sách models nếu store chưa có
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

  const selectedMeta = selectedModel ? resolveModelMeta(selectedModel) : null

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
      {/* Premium Capsule Trigger Button: custom animated gradient & glow */}
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
        className="model-selector-trigger group relative flex h-9 items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 dark:border-white/15 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:shadow-md hover:shadow-amber-500/25 dark:hover:shadow-indigo-500/30 zyricon:hover:shadow-[rgba(194,117,149,0.35)] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#15803D] dark:focus-visible:ring-emerald-400 zyricon:focus-visible:ring-[#C27595] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131923] zyricon:focus-visible:ring-offset-[#07040B] focus-visible:outline-none select-none bg-gradient-to-r"
      >
        {/* Glow underlay blur (reproducing sample button-content::before) */}
        <span
          className="model-selector-glow"
          aria-hidden="true"
        />

        {/* AI Icon in micro-badge */}
        <span
          data-testid="model-trigger-icon"
          className="model-selector-icon-badge relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white p-0.5 text-white text-[11px] font-bold ring-1 ring-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)] select-none overflow-hidden"
          aria-hidden="true"
        >
          {selectedMeta?.logo ? (
            <>
              <img
                src={selectedMeta.logo}
                alt=""
                className="h-full w-full object-contain rounded-full"
                onError={(e) => {
                  if (selectedMeta.fallbackLogo && e.currentTarget.src !== selectedMeta.fallbackLogo) {
                    e.currentTarget.src = selectedMeta.fallbackLogo
                  }
                }}
              />
              <span className="sr-only">✦</span>
            </>
          ) : (
            selectedMeta?.icon ?? '✦'
          )}
        </span>

        {/* Model Label Prefix */}
        <span className="hidden sm:inline text-xs font-normal text-white/80 select-none">
          Model:
        </span>

        {/* Selected Model Name */}
        <span className="model-selector-name max-w-[110px] sm:max-w-[150px] truncate font-semibold text-white tracking-tight">
          {selectedModel?.name ?? 'Chọn model'}
        </span>

        {/* Animated Chevron */}
        <svg
          className={`model-selector-chevron h-3.5 w-3.5 text-white/90 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            isOpen ? 'rotate-180 text-white' : 'group-hover:text-white'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
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

      {/* Custom Dropdown Menu: Premium Popover with glassmorphism, Roving Tabindex & responsive layout */}
      {isOpen && (
        <div
          id="model-selector-listbox"
          role="listbox"
          tabIndex={-1}
          aria-labelledby="model-selector-btn"
          onKeyDown={handleDropdownKeyDown}
          className="model-selector-popover absolute right-0 top-full mt-2.5 z-50 w-72 max-w-[calc(100vw-4.5rem)] sm:w-80 sm:max-w-none rounded-2xl border border-slate-200/90 dark:border-white/[0.08] zyricon:border-[#694788]/35 bg-white/95 dark:bg-[#131923]/96 zyricon:bg-[#120B1C]/96 p-2 shadow-2xl shadow-slate-900/15 dark:shadow-black/80 zyricon:shadow-[0_12px_40px_rgba(7,4,11,0.9)] backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 zyricon:ring-[#694788]/20 animate-dropdown-fade space-y-1 focus:outline-none origin-top-right"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-white/[0.06] zyricon:border-[#694788]/25 mb-1 select-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] zyricon:text-[#C4A5B8] flex items-center gap-1.5">
              <span className="text-amber-500 dark:text-indigo-400 zyricon:text-[#C27595] text-xs" aria-hidden="true">✦</span>
              Mô hình AI
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500/30 zyricon:bg-[#3B2568]/40 zyricon:text-[#C27595] border border-amber-300/60 dark:border-indigo-500/30 zyricon:border-[#694788]/30 shadow-xs">
              {models.filter((m) => m.available !== false).length} khả dụng
            </span>
          </div>

          {/* Model Options List */}
          <div className="max-h-[320px] overflow-y-auto space-y-1 scrollbar-thin">
            {models.map((model, index) => {
              const isAvailable = model.available !== false
              const isSelected = model.id === (selectedModelId ?? models[0]?.id)
              const isKeyboardFocused = focusedIndex === index
              const meta = resolveModelMeta(model)

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
                  className={`model-card w-full rounded-xl p-2.5 text-left transition-all duration-150 flex items-center justify-between gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] dark:focus-visible:ring-emerald-400 zyricon:focus-visible:ring-[#C27595] ${
                    !isAvailable
                      ? 'opacity-40 cursor-not-allowed border border-transparent select-none'
                      : isSelected
                      ? 'border border-amber-400/60 dark:border-indigo-500/40 zyricon:border-[#C27595]/50 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 dark:from-indigo-950/40 dark:via-indigo-900/30 dark:to-transparent zyricon:from-[#3B2568]/50 zyricon:via-[#2D1B4E]/60 zyricon:to-[#20103A]/70 shadow-xs cursor-pointer'
                      : isKeyboardFocused
                      ? 'border border-slate-300 dark:border-indigo-500/40 zyricon:border-[#694788]/50 bg-slate-100 dark:bg-[#1E1B4B]/50 zyricon:bg-[#1D132D] cursor-pointer'
                      : 'border border-transparent hover:border-amber-300/70 dark:hover:border-indigo-500/30 zyricon:hover:border-[#694788]/40 hover:bg-amber-50/70 dark:hover:bg-[#1E1B4B]/35 zyricon:hover:bg-[#1D132D]/70 hover:translate-x-0.5 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Icon Badge */}
                    <div
                      className={`model-card-icon relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-1 shadow-xs border transition-transform overflow-hidden ${
                        !isAvailable
                          ? 'border-slate-200/50 dark:border-white/5 bg-slate-100/50 dark:bg-white/5 opacity-60'
                          : meta.iconBg
                      }`}
                      aria-hidden="true"
                    >
                      {meta.logo ? (
                        <img
                          src={meta.logo}
                          alt=""
                          className={`h-full w-full object-contain rounded-lg ${!isAvailable ? 'grayscale opacity-60' : ''}`}
                          loading="lazy"
                          onError={(e) => {
                            if (meta.fallbackLogo && e.currentTarget.src !== meta.fallbackLogo) {
                              e.currentTarget.src = meta.fallbackLogo
                            }
                          }}
                        />
                      ) : (
                        <span className={`text-xs font-bold ${meta.iconColor}`}>
                          {meta.icon}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`truncate text-xs font-semibold tracking-tight ${
                            !isAvailable
                              ? 'text-slate-400 dark:text-[#64748B] zyricon:text-[#8F7686]'
                              : isSelected
                              ? 'text-amber-800 dark:text-indigo-300 zyricon:text-[#C27595]'
                              : 'text-slate-900 dark:text-[#F1F5F9] zyricon:text-[#F7F3F6]'
                          }`}
                        >
                          {model.name}
                        </span>

                        {!isAvailable ? (
                          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-slate-200/90 dark:bg-[#131923] zyricon:bg-[#1A102A] text-slate-700 dark:text-[#94A3B8] zyricon:text-[#8F7686] border border-slate-300/40 dark:border-white/[0.08] zyricon:border-[#694788]/25">
                            {model.disabledReason || 'Không khả dụng'}
                          </span>
                        ) : meta.badgeText ? (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-xs ${
                              meta.badgeColor || 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                            }`}
                          >
                            {meta.badgeText}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] zyricon:text-[#C4A5B8] truncate mt-0.5">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Active Selected Checkmark */}
                  {isSelected && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-semibold text-amber-800 dark:text-indigo-300 zyricon:text-[#C27595] bg-amber-100/70 dark:bg-indigo-950/60 zyricon:bg-[#3B2568]/40 px-1.5 py-0.5 rounded-full border border-amber-300/50 dark:border-indigo-500/30 zyricon:border-[#694788]/30">
                        Đang chọn
                      </span>
                      <svg className="h-4 w-4 text-amber-600 dark:text-indigo-400 zyricon:text-[#C27595]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
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
