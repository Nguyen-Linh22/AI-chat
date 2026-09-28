import { useState } from 'react'
import ChatLayout from '../layouts/ChatLayout'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'

function ChatPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <ChatLayout>
      <div className="flex h-full w-full overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3 bg-[#F8FAFC] dark:bg-[#0B0F17] relative transition-colors duration-200">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <ChatArea
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
      </div>
    </ChatLayout>
  )
}

export default ChatPage