import { memo } from 'react'
import '../../assets/chat-background/background.css'

interface ChatBackgroundProps {
  className?: string
}

function ChatBackgroundComponent({ className = '' }: ChatBackgroundProps) {
  return (
    <div
      className={`chat-stars-bg absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`.trim()}
      aria-hidden="true"
      data-testid="chat-background"
    >
      <div className="chat-stars-layer-1" />
      <div className="chat-stars-layer-2" />
      <div className="chat-stars-layer-3" />
    </div>
  )
}

export const ChatBackground = memo(ChatBackgroundComponent)
export default ChatBackground
