import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChats, createChat, deleteChat, renameChat } from './chatService'
import { apiClient } from './apiClient'

describe('chatService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return chats when response is ok', async () => {
    const mockChats = [
      {
        id: 'chat-1',
        title: 'Chat 1',
        userId: 'user-1',
        createdAt: '2026-09-27T00:00:00.000Z',
        updatedAt: '2026-09-27T00:00:00.000Z',
      },
      {
        id: 'chat-2',
        title: 'Chat 2',
        userId: 'user-1',
        createdAt: '2026-09-27T01:00:00.000Z',
        updatedAt: '2026-09-27T01:00:00.000Z',
      },
    ]

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: true,
      json: async () => ({ chats: mockChats }),
    } as Response)

    const chats = await getChats()

    expect(apiClient.get).toHaveBeenCalledWith('/api/chats')
    expect(chats).toEqual(mockChats)
  })

  it('should throw an error when response is not ok', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(getChats()).rejects.toThrow(
      'Không thể lấy danh sách chat'
    )

    expect(apiClient.get).toHaveBeenCalledWith('/api/chats')
  })

  it('should create and return a chat when response is ok', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Đoạn chat mới',
      userId: 'user-1',
      createdAt: '2026-09-27T00:00:00.000Z',
      updatedAt: '2026-09-27T00:00:00.000Z',
    }

    vi.spyOn(apiClient, 'post').mockResolvedValue({
      ok: true,
      json: async () => ({ chat: mockChat }),
    } as Response)

    const chat = await createChat()

    expect(apiClient.post).toHaveBeenCalledWith('/api/chats')
    expect(chat).toEqual(mockChat)
  })

  it('should throw an error when create chat response is not ok', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(createChat()).rejects.toThrow(
      'Không thể tạo chat mới'
    )

    expect(apiClient.post).toHaveBeenCalledWith('/api/chats')
  })

  it('should delete a chat when response is ok', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValue({
      ok: true,
    } as Response)

    await deleteChat('chat-1')

    expect(apiClient.delete).toHaveBeenCalledWith('/api/chats/chat-1')
  })

  it('should throw an error when delete chat response is not ok', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(deleteChat('chat-1')).rejects.toThrow(
      'Không thể xóa chat'
    )

    expect(apiClient.delete).toHaveBeenCalledWith('/api/chats/chat-1')
  })

  it('should rename and return the updated chat when response is ok', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Tên chat mới',
      userId: 'user-1',
      createdAt: '2026-09-27T00:00:00.000Z',
      updatedAt: '2026-09-27T01:00:00.000Z',
    }

    vi.spyOn(apiClient, 'patch').mockResolvedValue({
      ok: true,
      json: async () => ({ chat: mockChat }),
    } as Response)

    const chat = await renameChat('chat-1', 'Tên chat mới')

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/chats/chat-1',
      { title: 'Tên chat mới' }
    )
    expect(chat).toEqual(mockChat)
  })

  it('should throw an error when rename chat response is not ok', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValue({
      ok: false,
    } as Response)

    await expect(
      renameChat('chat-1', 'Tên chat mới')
    ).rejects.toThrow('Không thể đổi tên chat')

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/chats/chat-1',
      { title: 'Tên chat mới' }
    )
  })
})
