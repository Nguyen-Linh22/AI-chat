import { useEffect } from 'react'
import { getCurrentUser } from '../services/authService'
import { getChats } from '../services/chatService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'

function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)

  const setChats = useChatStore((state) => state.setChats)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser()

        if (!user) {
          clearUser()
          setChats([])
          return
        }

        setUser(user)

        const chats = await getChats()

        setChats(chats)
      } catch (error) {
        console.error('Không thể khởi tạo ứng dụng:', error)

        clearUser()
        setChats([])
      }
    }

    initializeAuth()
  }, [setUser, clearUser, setChats])

  return null
}

export default AuthInitializer