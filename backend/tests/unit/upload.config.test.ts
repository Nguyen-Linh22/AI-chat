import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getUploadDir, ensureUploadDir, UPLOAD_DIR } from '../../src/config/upload.config.js'

describe('16.7-B Upload Directory Configuration', () => {
  const testBaseDir = path.join(process.cwd(), 'tests', 'unit', 'tmp_upload_test')

  afterAll(() => {
    try {
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true })
      }
    } catch {
      // ignore cleanup errors
    }
  })

  it('should return a valid upload directory path', () => {
    const dir = getUploadDir()
    expect(typeof dir).toBe('string')
    expect(dir.length).toBeGreaterThan(0)
    expect(path.basename(dir)).toBe('uploads')
    expect(UPLOAD_DIR).toBe(dir)
  })

  it('should create the directory if it does not exist', () => {
    const targetDir = path.join(testBaseDir, 'new_uploads')
    expect(fs.existsSync(targetDir)).toBe(false)

    const createdDir = ensureUploadDir(targetDir)
    expect(createdDir).toBe(targetDir)
    expect(fs.existsSync(targetDir)).toBe(true)
  })

  it('should be idempotent and not throw when called repeatedly', () => {
    const targetDir = path.join(testBaseDir, 'idempotent_uploads')

    expect(() => {
      ensureUploadDir(targetDir)
      ensureUploadDir(targetDir)
      ensureUploadDir(targetDir)
    }).not.toThrow()

    expect(fs.existsSync(targetDir)).toBe(true)
  })

  it('should allow creating and deleting files within the ensured directory', () => {
    const targetDir = path.join(testBaseDir, 'writable_uploads')
    ensureUploadDir(targetDir)

    const testFilePath = path.join(targetDir, 'test-file.tmp')
    fs.writeFileSync(testFilePath, 'temp upload content')
    expect(fs.existsSync(testFilePath)).toBe(true)

    fs.unlinkSync(testFilePath)
    expect(fs.existsSync(testFilePath)).toBe(false)
  })
})
