import { describe, it, expect } from 'vitest'
import {
  validateAIProvider,
  validateGeminiModel,
  VALID_AI_PROVIDERS
} from '../../src/ai/ai.config.js'

describe('AI Config - validateAIProvider', () => {
  it('should fallback to ollama in local development when AI_PROVIDER is unset', () => {
    const provider = validateAIProvider(undefined, 'development')
    expect(provider).toBe('ollama')
  })

  it('should use configured provider in local development if valid', () => {
    const provider = validateAIProvider('gemini', 'development')
    expect(provider).toBe('gemini')
  })

  it('should fallback to ollama in local development if provider is invalid', () => {
    const provider = validateAIProvider('unknown-provider', 'development')
    expect(provider).toBe('ollama')
  })

  it('should throw an error in production when AI_PROVIDER is unset', () => {
    expect(() => validateAIProvider(undefined, 'production')).toThrow(
      'AI_PROVIDER chưa được cấu hình cho môi trường production'
    )
  })

  it('should throw an error in production when AI_PROVIDER is invalid', () => {
    expect(() => validateAIProvider('invalid-provider', 'production')).toThrow(
      /AI_PROVIDER không hợp lệ: "invalid-provider"/
    )
  })

  it('should return valid provider in production when correctly configured', () => {
    VALID_AI_PROVIDERS.forEach((validProvider) => {
      const result = validateAIProvider(validProvider, 'production')
      expect(result).toBe(validProvider)
    })
  })

  it('should require GEMINI_MODEL for the Gemini production provider', () => {
    expect(() => validateGeminiModel(undefined, 'gemini', 'production')).toThrow(
      'GEMINI_MODEL chưa được cấu hình'
    )
  })

  it('should accept the approved Gemini production model', () => {
    expect(
      validateGeminiModel('gemini-3.6-flash', 'gemini', 'production')
    ).toBe('gemini-3.6-flash')
  })

  it('should reject an unapproved Gemini production model', () => {
    expect(() =>
      validateGeminiModel('gemini-unapproved', 'gemini', 'production')
    ).toThrow(/GEMINI_MODEL không hợp lệ/)
  })

  it('should not require GEMINI_MODEL for non-Gemini production providers or non-production', () => {
    expect(validateGeminiModel(undefined, 'openai', 'production')).toBeUndefined()
    expect(validateGeminiModel(undefined, 'gemini', 'test')).toBeUndefined()
  })
})
