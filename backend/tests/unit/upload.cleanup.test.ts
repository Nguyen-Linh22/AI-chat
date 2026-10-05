import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { cleanupTempUploads } from '../../src/config/upload.config.js'

describe('16.10-B Cleanup Temporary Uploads', () => {
  const testDir = path.join(process.cwd(), 'tests', 'unit', 'tmp_cleanup_test')

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch {
      // ignore
    }
  })

  it('xóa các file tạm có mtime cũ hơn khoảng thời gian an toàn maxAgeMs', () => {
    const oldFilePath = path.join(testDir, 'old-orphan-file.tmp')
    const recentFilePath = path.join(testDir, 'recent-upload.tmp')
    const subDirPath = path.join(testDir, 'nested-folder')

    // Tạo file cũ
    fs.writeFileSync(oldFilePath, 'old content')
    const twoHoursAgoSec = (Date.now() - 2 * 60 * 60 * 1000) / 1000
    fs.utimesSync(oldFilePath, twoHoursAgoSec, twoHoursAgoSec)

    // Tạo file mới
    fs.writeFileSync(recentFilePath, 'recent content')

    // Tạo thư mục con
    fs.mkdirSync(subDirPath)

    // Chạy cleanup với maxAge = 1 giờ
    const result = cleanupTempUploads(testDir, 60 * 60 * 1000)

    expect(result.cleanedCount).toBe(1)
    expect(result.errorCount).toBe(0)

    // File cũ bị xóa
    expect(fs.existsSync(oldFilePath)).toBe(false)

    // File mới vẫn còn nguyên
    expect(fs.existsSync(recentFilePath)).toBe(true)

    // Thư mục con không bị xóa
    expect(fs.existsSync(subDirPath)).toBe(true)
  })

  it('không xóa bất kỳ file nào nếu tất cả file đều mới', () => {
    const file1 = path.join(testDir, 'file1.tmp')
    const file2 = path.join(testDir, 'file2.tmp')

    fs.writeFileSync(file1, 'data 1')
    fs.writeFileSync(file2, 'data 2')

    const result = cleanupTempUploads(testDir, 60 * 60 * 1000)

    expect(result.cleanedCount).toBe(0)
    expect(result.errorCount).toBe(0)
    expect(fs.existsSync(file1)).toBe(true)
    expect(fs.existsSync(file2)).toBe(true)
  })

  it('xử lý an toàn khi thư mục rỗng', () => {
    const result = cleanupTempUploads(testDir, 60 * 60 * 1000)
    expect(result.cleanedCount).toBe(0)
    expect(result.errorCount).toBe(0)
  })

  it('xử lý an toàn và tự tạo thư mục nếu thư mục chưa tồn tại', () => {
    const nonExistentDir = path.join(testDir, 'does-not-exist-yet')
    const result = cleanupTempUploads(nonExistentDir, 60 * 60 * 1000)

    expect(result.cleanedCount).toBe(0)
    expect(result.errorCount).toBe(0)
    expect(fs.existsSync(nonExistentDir)).toBe(true)
  })
})
