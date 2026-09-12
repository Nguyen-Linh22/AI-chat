import type { ReactNode } from 'react'

interface ChatLayoutProps {
  children: ReactNode
}

function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {children}
    </div>
  )
}

export default ChatLayout