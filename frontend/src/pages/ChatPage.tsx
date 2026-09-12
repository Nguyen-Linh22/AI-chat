import ChatLayout from '../layouts/ChatLayout'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'

function ChatPage() {
  return (
    <ChatLayout>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <ChatArea />
      </div>
    </ChatLayout>
  )
}

export default ChatPage