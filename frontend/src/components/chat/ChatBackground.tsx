import { lazy, memo, Suspense } from 'react'
import { useThemeStore, isWorkspacePath } from '../../stores/themeStore'
import { CosmicStaticFallback } from '../../theme/zyricon/CosmicStaticFallback'
import { CelestialDaylightBackground } from '../../theme/celestial'
import '../../assets/chat-background/background.css'

// Lazy-load ZyriconCosmicCanvas so Three.js chunk is never fetched on Light/Dark themes
const LazyZyriconCosmicCanvas = lazy(() =>
  import('../../theme/zyricon/ZyriconCosmicCanvas').then((m) => ({
    default: m.ZyriconCosmicCanvas,
  }))
)

interface ChatBackgroundProps {
  className?: string
}

function ChatBackgroundComponent({ className = '' }: ChatBackgroundProps) {
  const theme = useThemeStore((state) => state.theme)
  const isWorkspace = isWorkspacePath()
  const isZyriconActive = theme === 'zyricon' && isWorkspace
  const isLightActive = theme === 'light'

  return (
    <div
      className={`chat-stars-bg absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`.trim()}
      aria-hidden="true"
      data-testid="chat-background"
    >
      {isZyriconActive ? (
        <Suspense fallback={<CosmicStaticFallback />}>
          <LazyZyriconCosmicCanvas />
        </Suspense>
      ) : isLightActive ? (
        <CelestialDaylightBackground />
      ) : (
        <>
          <div className="chat-stars-layer-1" />
          <div className="chat-stars-layer-2" />
          <div className="chat-stars-layer-3" />
        </>
      )}
    </div>
  )
}

export const ChatBackground = memo(ChatBackgroundComponent)
export default ChatBackground
