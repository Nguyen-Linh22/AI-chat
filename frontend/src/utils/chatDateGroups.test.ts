import { describe, expect, it } from 'vitest'
import { groupChatsByDate } from './chatDateGroups'
import type { ChatSession } from '../services/chatService'

describe('chatDateGroups', () => {
  const refDate = new Date(2026, 9, 12, 14, 0, 0) // October 12, 2026 14:00 local time

  it('should return empty array when chats is empty', () => {
    expect(groupChatsByDate([], refDate)).toEqual([])
  })

  it('should group chats correctly into today, yesterday, 7 days ago, and older', () => {
    const chats: ChatSession[] = [
      {
        id: '1',
        userId: 'u1',
        title: 'Today Chat',
        createdAt: new Date(2026, 9, 12, 9, 30, 0).toISOString(),
        updatedAt: '',
      },
      {
        id: '2',
        userId: 'u1',
        title: 'Yesterday Chat',
        createdAt: new Date(2026, 9, 11, 20, 0, 0).toISOString(),
        updatedAt: '',
      },
      {
        id: '3',
        userId: 'u1',
        title: '5 Days Ago Chat',
        createdAt: new Date(2026, 9, 7, 12, 0, 0).toISOString(),
        updatedAt: '',
      },
      {
        id: '4',
        userId: 'u1',
        title: 'Older Chat',
        createdAt: new Date(2026, 8, 1, 10, 0, 0).toISOString(),
        updatedAt: '',
      },
    ]

    const groups = groupChatsByDate(chats, refDate)

    expect(groups).toHaveLength(4)
    expect(groups[0].label).toBe('Hôm nay')
    expect(groups[0].chats.map((c) => c.id)).toEqual(['1'])

    expect(groups[1].label).toBe('Hôm qua')
    expect(groups[1].chats.map((c) => c.id)).toEqual(['2'])

    expect(groups[2].label).toBe('7 ngày trước')
    expect(groups[2].chats.map((c) => c.id)).toEqual(['3'])

    expect(groups[3].label).toBe('Cũ hơn')
    expect(groups[3].chats.map((c) => c.id)).toEqual(['4'])
  })

  it('should place chats without createdAt into Hôm nay so they are not lost', () => {
    const chats = [
      {
        id: 'legacy-1',
        title: 'No timestamp',
      } as ChatSession,
    ]

    const groups = groupChatsByDate(chats, refDate)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Hôm nay')
    expect(groups[0].chats[0].id).toBe('legacy-1')
  })

  it('should place chats with invalid timestamp into Cũ hơn', () => {
    const chats = [
      {
        id: 'invalid-1',
        title: 'Invalid timestamp',
        createdAt: 'not-a-valid-date',
      } as ChatSession,
    ]

    const groups = groupChatsByDate(chats, refDate)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Cũ hơn')
    expect(groups[0].chats[0].id).toBe('invalid-1')
  })
})
