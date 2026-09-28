import type { ReactNode } from 'react'

interface ChatLayoutProps {
  children: ReactNode
}

function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-white transition-colors duration-200">
      {children}
    </div>
  )
}

export default ChatLayout