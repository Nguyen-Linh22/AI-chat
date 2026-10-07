import { describe, it, expect, vi, beforeEach } from 'vitest'

const { embedContentMock, queryRawMock } = vi.hoisted(() => ({
  embedContentMock: vi.fn(),
  queryRawMock: vi.fn()
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      embedContent: embedContentMock
    }
  }
}))

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    $queryRaw: queryRawMock
  }
}))

import { semanticSearch, buildContext } from '../../src/rag/rag.service.js'

describe('RAG Service - semanticSearch with imageUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    embedContentMock.mockResolvedValue({
      embeddings: [
        {
          values: [0.01, 0.02, 0.03]
        }
      ]
    })
  })

  it('should return chunks with imageUrl when present in DocumentChunk', async () => {
    const mockDbResult = [
      {
        id: 'chunk-1',
        content: 'Nội dung có hình',
        chunkIndex: 0,
        imageUrl: 'https://example.com/image.png',
        distance: 0.1
      }
    ]

    queryRawMock.mockResolvedValue(mockDbResult)

    const results = await semanticSearch('câu hỏi về hình ảnh', 3)

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('chunk-1')
    expect(results[0].content).toBe('Nội dung có hình')
    expect(results[0].chunkIndex).toBe(0)
    expect(results[0].imageUrl).toBe('https://example.com/image.png')
    expect(results[0].distance).toBe(0.1)
  })

  it('should return chunks with imageUrl as null when chunk has no image', async () => {
    const mockDbResult = [
      {
        id: 'chunk-2',
        content: 'Nội dung text',
        chunkIndex: 1,
        imageUrl: null,
        distance: 0.2
      }
    ]

    queryRawMock.mockResolvedValue(mockDbResult)

    const results = await semanticSearch('câu hỏi văn bản thông thường', 3)

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('chunk-2')
    expect(results[0].content).toBe('Nội dung text')
    expect(results[0].chunkIndex).toBe(1)
    expect(results[0].imageUrl).toBeNull()
    expect(results[0].distance).toBe(0.2)
  })

  it('should include "imageUrl" in the SQL SELECT query', async () => {
    queryRawMock.mockResolvedValue([])

    await semanticSearch('kiểm tra query SQL', 3)

    expect(queryRawMock).toHaveBeenCalledTimes(1)
    const [templateStrings] = queryRawMock.mock.calls[0]
    const sqlText = Array.isArray(templateStrings)
      ? templateStrings.join(' ')
      : String(templateStrings)

    expect(sqlText).toContain('"imageUrl"')
    expect(sqlText).toContain('"content"')
    expect(sqlText).toContain('"chunkIndex"')
  })
})

describe('RAG Service - buildContext with imageUrl', () => {
  // TEST 1 — imageUrl có giá trị
  it('should include [Image URL] section when imageUrl has value', () => {
    const input = [
      {
        content: 'Nội dung có hình',
        chunkIndex: 0,
        imageUrl: 'https://example.com/image.png'
      }
    ]

    const context = buildContext(input)

    expect(context).toContain('[Chunk 0]')
    expect(context).toContain('Nội dung có hình')
    expect(context).toContain('[Image URL]')
    expect(context).toContain('https://example.com/image.png')
    expect(context).toBe(
      '[Chunk 0]\nNội dung có hình\n\n[Image URL]\nhttps://example.com/image.png'
    )
  })

  // TEST 2 — imageUrl === null
  it('should NOT include [Image URL] section when imageUrl is null', () => {
    const input = [
      {
        content: 'Nội dung text',
        chunkIndex: 1,
        imageUrl: null
      }
    ]

    const context = buildContext(input)

    expect(context).toContain('[Chunk 1]')
    expect(context).toContain('Nội dung text')
    expect(context).not.toContain('[Image URL]')
    expect(context).toBe('[Chunk 1]\nNội dung text')
  })

  // TEST 3 — imageUrl undefined / empty / whitespace
  it('should NOT include [Image URL] section when imageUrl is undefined, empty, or whitespace', () => {
    const inputUndefined = [
      {
        content: 'Nội dung undefined',
        chunkIndex: 0,
        imageUrl: undefined
      }
    ]
    const contextUndefined = buildContext(inputUndefined)
    expect(contextUndefined).not.toContain('[Image URL]')
    expect(contextUndefined).toBe('[Chunk 0]\nNội dung undefined')

    const inputEmpty = [
      {
        content: 'Nội dung empty',
        chunkIndex: 1,
        imageUrl: ''
      }
    ]
    const contextEmpty = buildContext(inputEmpty)
    expect(contextEmpty).not.toContain('[Image URL]')
    expect(contextEmpty).toBe('[Chunk 1]\nNội dung empty')

    const inputWhitespace = [
      {
        content: 'Nội dung whitespace',
        chunkIndex: 2,
        imageUrl: '   '
      }
    ]
    const contextWhitespace = buildContext(inputWhitespace)
    expect(contextWhitespace).not.toContain('[Image URL]')
    expect(contextWhitespace).toBe('[Chunk 2]\nNội dung whitespace')
  })

  // TEST 4 — mixed chunks
  it('should handle mixed chunks with and without imageUrl correctly', () => {
    const input = [
      {
        content: 'Có ảnh',
        chunkIndex: 0,
        imageUrl: 'https://example.com/a.png'
      },
      {
        content: 'Không có ảnh',
        chunkIndex: 1,
        imageUrl: null
      }
    ]

    const context = buildContext(input)

    expect(context).toBe(
      '[Chunk 0]\nCó ảnh\n\n[Image URL]\nhttps://example.com/a.png\n\n[Chunk 1]\nKhông có ảnh'
    )
  })

  // TEST 5 — bảo toàn content
  it('should preserve content verbatim including special characters and brackets', () => {
    const specialContent =
      'Nội dung [test] với URL https://example.com và ký tự đặc biệt.'
    const input = [
      {
        content: specialContent,
        chunkIndex: 0,
        imageUrl: 'https://example.com/image.png'
      }
    ]

    const context = buildContext(input)

    expect(context).toContain(specialContent)
  })

  // TEST 6 — immutability
  it('should not mutate the input array or its objects', () => {
    const input = [
      {
        content: 'Item 1',
        chunkIndex: 0,
        imageUrl: 'https://example.com/1.png'
      },
      {
        content: 'Item 2',
        chunkIndex: 1,
        imageUrl: null
      }
    ]

    const snapshot = JSON.parse(JSON.stringify(input))

    buildContext(input)

    expect(input).toEqual(snapshot)
  })

  // TEST 7 — backward compatibility
  it('should remain compatible with callers providing only content and chunkIndex', () => {
    const input = [
      {
        content: 'Text only',
        chunkIndex: 0
      }
    ]

    const context = buildContext(input)

    expect(context).toBe('[Chunk 0]\nText only')
    expect(context).not.toContain('[Image URL]')
  })
})
