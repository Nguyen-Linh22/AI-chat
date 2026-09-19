import { useEffect } from 'react'
import { getCurrentUser } from '../services/authService'
import { getChats } from '../services/chatService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'

function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)

  const setChats = useChatStore((state) => state.setChats)
  const setCurrentChatId = useChatStore(
    (state) => state.setCurrentChatId
  )

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser()

        if (!user) {
          clearUser()
          setChats([])
          setCurrentChatId(null)
          return
        }

        setUser(user)

        const chats = await getChats()

        setChats(chats)

        if (chats.length > 0) {
          setCurrentChatId(chats[0].id)
        } else {
          setCurrentChatId(null)
        }
      } catch (error) {
        console.error('Không thể khởi tạo ứng dụng:', error)

        clearUser()
        setChats([])
        setCurrentChatId(null)
      }
    }

    initializeAuth()
  }, [
    setUser,
    clearUser,
    setChats,
    setCurrentChatId
  ])

  return null
}

export default AuthInitializer