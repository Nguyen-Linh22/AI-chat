import { useState } from 'react'
import ChatLayout from '../layouts/ChatLayout'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'

function ChatPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <ChatLayout>
      <div
        className="flex h-full w-full overflow-hidden relative transition-colors duration-200 bg-workspace-canvas"
      >
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <ChatArea
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>
    </ChatLayout>
  )
}

export default ChatPage