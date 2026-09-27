import { test, expect } from '@playwright/test'

test('authenticated user can create a new chat', async ({ page }) => {
  await page.goto('/chat')
  await expect(page).toHaveURL(/\/chat$/)

  // Create new chat
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  // The newly created chat should appear in the sidebar.
  await expect(
    page.getByText('Đoạn chat mới', { exact: true })
  ).toBeVisible()

  // URL should contain the created chat UUID.
  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$/i)
})

test('user can select, rename, and delete a chat', async ({ page }) => {
  await page.goto('/chat')
  await expect(page).toHaveURL(/\/chat$/)

  // Create Chat A
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/i)
  const chatAUrl = page.url()

  // Create Chat B
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  await page.waitForURL((url) => url.toString() !== chatAUrl)
  const chatBUrl = page.url()

  // In sidebar, newly added chats are prepended: Chat B is index 0, Chat A is index 1
  const chatItems = page.getByRole('button', { name: '💬 Đoạn chat mới' })
  const chatBItem = chatItems.first()
  const chatAItem = chatItems.nth(1)
  await expect(chatBItem).toBeVisible()

  // Select Chat A
  await chatAItem.click()
  await expect(page).toHaveURL(chatAUrl)

  // Rename Chat A
  const chatARow = chatAItem.locator('..')
  await chatARow.hover()

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt')
    await dialog.accept('Chat E2E Renamed')
  })

  await chatARow.getByTitle('Đổi tên chat').click()

  await expect(
    page.getByText('Chat E2E Renamed', { exact: true })
  ).toBeVisible()

  // Delete Chat A
  const renamedChat = page.getByText('Chat E2E Renamed', { exact: true })
  const renamedChatRow = renamedChat.locator('../..')

  await renamedChatRow.hover()

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm')
    await dialog.accept()
  })

  await renamedChatRow.getByTitle('Xóa chat').click()

  // Chat A should disappear
  await expect(
    page.getByText('Chat E2E Renamed', { exact: true })
  ).not.toBeVisible()

  // Chat B must remain
  await expect(chatBItem).toBeVisible()
})

test('authenticated user can send a message in a chat', async ({ page }) => {
  test.setTimeout(90_000)

  const message = 'Hello from E2E test'

  await page.goto('/chat')
  await expect(page).toHaveURL(/\/chat$/)

  // Create chat
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  await expect(page).toHaveURL(
    /\/c\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$/i
  )

  // Đợi ChatArea hoàn tất tải lịch sử chat ban đầu
  await expect(
    page.getByText('Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')
  ).toBeVisible()

  // Send message
  const input = page.getByPlaceholder('Nhập tin nhắn...')

  await input.fill(message)
  await page.getByRole('button', { name: 'Gửi' }).click()

  // User message should appear immediately
  await expect(
    page.getByText(message, { exact: true })
  ).toBeVisible()

  // AI generation should start
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).toBeVisible()

  // AI generation should finish
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).not.toBeVisible({ timeout: 60_000 })

  // Completed AI message should expose the regenerate action
  await expect(
    page.getByTitle('Tạo lại câu trả lời')
  ).toBeVisible({ timeout: 10_000 })
})

test('AI response streams into the chat UI', async ({ page }) => {
  test.setTimeout(90_000)

  const message = 'Explain what an API is in one short sentence.'

  await page.goto('/chat')
  await expect(page).toHaveURL(/\/chat$/)

  // Create chat
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/)

  await expect(
    page.getByText('Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')
  ).toBeVisible()

  // Send message
  const input = page.getByPlaceholder('Nhập tin nhắn...')

  await input.fill(message)
  await page.getByRole('button', { name: 'Gửi' }).click()

  // Streaming state must start
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).toBeVisible()

  await expect(
    page.getByText('Đang nhập...', { exact: true })
  ).toBeVisible({ timeout: 10_000 })

  // Input must remain locked during streaming
  await expect(input).toBeDisabled()

  // Streaming must eventually finish
  await expect(
    page.getByText('Đang nhập...', { exact: true })
  ).not.toBeVisible({ timeout: 60_000 })

  // Stop button disappears after streaming
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).not.toBeVisible({ timeout: 10_000 })

  // Completed AI response exposes regenerate
  await expect(
    page.getByTitle('Tạo lại câu trả lời')
  ).toBeVisible({ timeout: 10_000 })
})

test('user can regenerate the latest AI response', async ({ page }) => {
  test.setTimeout(150_000)

  const message = 'Give me one short fact about the HTTP protocol.'

  await page.goto('/chat')
  await expect(page).toHaveURL(/\/chat$/)

  // Create chat
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/)

  await expect(
    page.getByText('Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')
  ).toBeVisible()

  // Send first message
  const input = page.getByPlaceholder('Nhập tin nhắn...')

  await input.fill(message)
  await page.getByRole('button', { name: 'Gửi' }).click()

  // Wait for first AI response to finish
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).not.toBeVisible({ timeout: 60_000 })

  await expect(
    page.getByTitle('Tạo lại câu trả lời')
  ).toBeVisible({ timeout: 10_000 })

  // There should be exactly one user message
  await expect(
    page.getByText(message, { exact: true })
  ).toHaveCount(1)

  // Regenerate
  await page.getByTitle('Tạo lại câu trả lời').click()

  // Regeneration should start
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).toBeVisible()

  await expect(
    page.getByText('Đang nhập...', { exact: true })
  ).toBeVisible({ timeout: 10_000 })

  // User message must still exist exactly once
  await expect(
    page.getByText(message, { exact: true })
  ).toHaveCount(1)

  // Regeneration should finish
  await expect(
    page.getByText('Đang nhập...', { exact: true })
  ).not.toBeVisible({ timeout: 60_000 })

  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).not.toBeVisible({ timeout: 10_000 })

  // Regenerate button should be available again
  await expect(
    page.getByTitle('Tạo lại câu trả lời')
  ).toBeVisible({ timeout: 10_000 })

  // Still exactly one user message after regeneration
  await expect(
    page.getByText(message, { exact: true })
  ).toHaveCount(1)
})

test('user can upload a text file and receive an AI response using its content', async ({ page }) => {
  test.setTimeout(150_000)

  const message = 'According to the attached file, what is the project codename?'

  await page.goto('/chat')
  await expect(page).toHaveURL(/\/chat$/)

  // Create chat
  await page.getByRole('button', { name: '+ Chat mới' }).click()

  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/)

  await expect(
    page.getByText('Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')
  ).toBeVisible()

  // Select file
  const fileInput = page.locator(
    'input[type="file"][accept=".pdf,.txt,application/pdf,text/plain"]'
  )

  await fileInput.setInputFiles({
    name: 'e2e-context.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(
      'E2E_TEST_SECRET_FACT: The project codename is ORANGE-NEBULA-742.'
    ),
  })

  // File preview should appear
  await expect(
    page.getByText('📎 e2e-context.txt', { exact: true })
  ).toBeVisible()

  // Send message with attachment
  const input = page.getByPlaceholder('Nhập tin nhắn...')

  await input.fill(message)
  await page.getByRole('button', { name: 'Gửi' }).click()

  // Streaming starts
  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).toBeVisible()

  await expect(
    page.getByText('Đang nhập...', { exact: true })
  ).toBeVisible({ timeout: 10_000 })

  // Attachment should appear in the sent user message
  await expect(
    page.getByText('📎 e2e-context.txt', { exact: true })
  ).toBeVisible({ timeout: 10_000 })

  // Wait for AI response to finish
  await expect(
    page.getByText('Đang nhập...', { exact: true })
  ).not.toBeVisible({ timeout: 60_000 })

  await expect(
    page.getByRole('button', { name: 'Dừng' })
  ).not.toBeVisible({ timeout: 10_000 })

  // Regenerate button proves the assistant message exists
  await expect(
    page.getByTitle('Tạo lại câu trả lời')
  ).toBeVisible({ timeout: 10_000 })

  // The AI response should contain the unique fact from the file
  await expect(
    page.getByText(/ORANGE-NEBULA-742/i)
  ).toBeVisible({ timeout: 10_000 })
})
