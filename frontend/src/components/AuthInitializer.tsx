import { useEffect } from 'react'
import { getCurrentUser } from '../services/authService'
import { getChats } from '../services/chatService'
import { getAIModels } from '../services/aiService'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useAIStore } from '../stores/aiStore'
import { useMessageStore } from '../stores/messageStore'

function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)
  const setChats = useChatStore((state) => state.setChats)
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId)
  const setModels = useAIStore((state) => state.setModels)
  const setSelectedModelId = useAIStore((state) => state.setSelectedModelId)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const models = await getAIModels()
        if (!isMounted) return
        setModels(models)

        const selectedModelId = useAIStore.getState().selectedModelId
        const selectedModelIsAvailable = models.some(
          (model) => model.id === selectedModelId
        )

        if (models.length > 0 && !selectedModelIsAvailable) {
          setSelectedModelId(models[0].id)
        }
      } catch (error) {
        console.error('Không thể lấy danh sách AI model:', error)
      }

      try {
        const user = await getCurrentUser()
        if (!isMounted) return

        if (!user) {
          clearUser()
          setChats([])
          setCurrentChatId(null)
          useMessageStore.getState().clearAll()
          return
        }

        setUser(user)

        const chats = await getChats()
        if (!isMounted) return
        setChats(chats)

        // Chỉ chọn chat đầu tiên nếu chưa chọn chat nào
        const activeChatId = useChatStore.getState().currentChatId
        const currentChatExists = chats.some((chat) => chat.id === activeChatId)

        if (!currentChatExists) {
          if (chats.length > 0) {
            setCurrentChatId(chats[0].id)
          } else {
            setCurrentChatId(null)
          }
        }
      } catch (error) {
        console.error('Không thể khởi tạo ứng dụng:', error)
        if (!isMounted) return
        clearUser()
        setChats([])
        setCurrentChatId(null)
        useMessageStore.getState().clearAll()
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [
    setUser,
    clearUser,
    setChats,
    setCurrentChatId,
    setModels,
    setSelectedModelId
  ])

  return null
}

export default AuthInitializer
