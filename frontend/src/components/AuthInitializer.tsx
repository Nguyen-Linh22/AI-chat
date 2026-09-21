import { useEffect } from 'react'
import { getCurrentUser } from '../services/authService'
import { getChats } from '../services/chatService'
import { getAIModels } from '../services/aiService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useAIStore } from '../stores/aiStore'

function AuthInitializer() {
  const setUser = useAuthStore(
    (state) => state.setUser
  )

  const clearUser = useAuthStore(
    (state) => state.clearUser
  )

  const setChats = useChatStore(
    (state) => state.setChats
  )

  const setCurrentChatId = useChatStore(
    (state) => state.setCurrentChatId
  )

  const currentChatId = useChatStore(
    (state) => state.currentChatId
  )

  const setModels = useAIStore(
    (state) => state.setModels
  )

  const setSelectedModelId = useAIStore(
    (state) => state.setSelectedModelId
  )

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const models = await getAIModels()

        setModels(models)

        if (models.length > 0) {
          setSelectedModelId(models[0].id)
        }
      } catch (error) {
        console.error(
          'Không thể lấy danh sách AI model:',
          error
        )
      }

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

        const currentChatExists = chats.some(
          (chat) => chat.id === currentChatId
        )

        if (!currentChatExists) {
          if (chats.length > 0) {
            setCurrentChatId(chats[0].id)
          } else {
            setCurrentChatId(null)
          }
        }
      } catch (error) {
        console.error(
          'Không thể khởi tạo ứng dụng:',
          error
        )

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
    setCurrentChatId,
    currentChatId,
    setModels,
    setSelectedModelId
  ])

  return null
}

export default AuthInitializer