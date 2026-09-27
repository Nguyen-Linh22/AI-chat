import { describe, expect, it, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { safeDeleteFile } from '../../src/utils/file.util.js'

describe('safeDeleteFile', () => {
  const testDir = path.join(process.cwd(), 'tests', 'unit', 'tmp')
  const testFile = path.join(testDir, 'safe-delete-test.txt')

  afterAll(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch {
      // ignore cleanup error
    }
  })

  it('should delete an existing file', () => {
    fs.mkdirSync(testDir, { recursive: true })
    fs.writeFileSync(testFile, 'test content')

    expect(fs.existsSync(testFile)).toBe(true)

    safeDeleteFile(testFile)

    expect(fs.existsSync(testFile)).toBe(false)
  })

  it('should not throw when filePath is undefined', () => {
    expect(() => safeDeleteFile()).not.toThrow()
  })

  it('should not throw when file does not exist', () => {
    const nonExistentFile = path.join(
      testDir,
      'file-that-does-not-exist.txt'
    )

    expect(() => safeDeleteFile(nonExistentFile)).not.toThrow()
  })

  it('should not throw when filePath is empty', () => {
    expect(() => safeDeleteFile('')).not.toThrow()
  })
})
