import type { ReactNode } from 'react'

interface ChatLayoutProps {
  children: ReactNode
}

function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="h-screen h-dvh w-screen overflow-hidden bg-workspace-canvas text-slate-800 dark:text-white transition-colors duration-200">
      {children}
    </div>
  )
}

export default ChatLayout