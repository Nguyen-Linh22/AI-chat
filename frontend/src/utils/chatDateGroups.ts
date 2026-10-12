import type { ChatSession } from '../services/chatService'

export type DateGroupId = 'today' | 'yesterday' | 'previous7Days' | 'older'

export interface ChatDateGroup {
  id: DateGroupId
  label: string
  chats: ChatSession[]
}

/**
 * Groups chat sessions into human-readable date buckets according to browser local timezone:
 * - Hôm nay: current calendar day (from 00:00:00 local time)
 * - Hôm qua: previous calendar day
 * - 7 ngày trước: previous 7 days (exclusive of yesterday)
 * - Cũ hơn: anything older or with invalid/missing date
 */
export function groupChatsByDate(chats: ChatSession[], referenceDate: Date = new Date()): ChatDateGroup[] {
  if (!chats || chats.length === 0) {
    return []
  }

  // Local calendar boundaries
  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime()

  const startOfYesterday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 1
  ).getTime()

  const startOf7DaysAgo = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 7
  ).getTime()

  const groups: Record<DateGroupId, ChatSession[]> = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  }

  for (const chat of chats) {
    if (!chat.createdAt) {
      // In mocks/tests where createdAt is omitted, keep them under 'today' so they remain accessible
      groups.today.push(chat)
      continue
    }

    const timestamp = new Date(chat.createdAt).getTime()

    if (Number.isNaN(timestamp)) {
      groups.older.push(chat)
      continue
    }

    if (timestamp >= startOfToday) {
      groups.today.push(chat)
    } else if (timestamp >= startOfYesterday) {
      groups.yesterday.push(chat)
    } else if (timestamp >= startOf7DaysAgo) {
      groups.previous7Days.push(chat)
    } else {
      groups.older.push(chat)
    }
  }

  const result: ChatDateGroup[] = [
    { id: 'today', label: 'Hôm nay', chats: groups.today },
    { id: 'yesterday', label: 'Hôm qua', chats: groups.yesterday },
    { id: 'previous7Days', label: '7 ngày trước', chats: groups.previous7Days },
    { id: 'older', label: 'Cũ hơn', chats: groups.older },
  ]

  return result.filter((g) => g.chats.length > 0)
}
