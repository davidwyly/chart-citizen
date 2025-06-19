/**
 * ERROR TYPES TESTS
 * =================
 * 
 * Tests for custom error types and type guards.
 * Extracted from: error-handling.test.ts
 */

import { describe, it, expect } from 'vitest'
import { 
  ChartCitizenError, 
  SystemLoadError, 
  NetworkError, 
  ValidationError, 
  RenderingError,
  UserInputError,
  DataParsingError,
  WebGLError,
  isChartCitizenError,
  isSystemError,
  isNetworkError,
  isValidationError,
  isRenderingError
} from '../errors'

describe('Error Types', () => {
  
  describe('Custom Error Types', () => {
    it('should create SystemLoadError with proper properties', () => {
      const context = { mode: 'star-citizen', systemId: 'stanton' }
      const error = new SystemLoadError('Failed to load system', context)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ChartCitizenError)
      expect(error).toBeInstanceOf(SystemLoadError)
      expect(error.name).toBe('SystemLoadError')
      expect(error.code).toBe('SYSTEM_LOAD_FAILED')
      expect(error.category).toBe('SYSTEM')
      expect(error.message).toBe('Failed to load system')
      expect(error.context).toEqual(context)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create NetworkError with proper properties', () => {
      const error = new NetworkError('Connection timeout')
      
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.category).toBe('NETWORK')
      expect(error.message).toBe('Connection timeout')
    })

    it('should create ValidationError with proper properties', () => {
      const error = new ValidationError('Invalid input data')
      
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.category).toBe('VALIDATION')
    })

    it('should create RenderingError with proper properties', () => {
      const error = new RenderingError('WebGL context lost')
      
      expect(error.code).toBe('RENDERING_ERROR')
      expect(error.category).toBe('RENDERING')
    })

    it('should create UserInputError with proper properties', () => {
      const error = new UserInputError('Invalid user input')
      
      expect(error.code).toBe('USER_INPUT_ERROR')
      expect(error.category).toBe('VALIDATION')
    })

    it('should create DataParsingError with proper properties', () => {
      const error = new DataParsingError('Failed to parse JSON')
      
      expect(error.code).toBe('DATA_PARSING_ERROR')
      expect(error.category).toBe('VALIDATION')
    })

    it('should create WebGLError with proper properties', () => {
      const error = new WebGLError('Shader compilation failed')
      
      expect(error.code).toBe('WEBGL_ERROR')
      expect(error.category).toBe('RENDERING')
    })

    it('should serialize to JSON properly', () => {
      const context = { field: 'test' }
      const error = new SystemLoadError('Test error', context)
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'SystemLoadError',
        message: 'Test error',
        code: 'SYSTEM_LOAD_FAILED',
        category: 'SYSTEM',
        timestamp: error.timestamp.toISOString(),
        context,
        stack: error.stack
      })
    })

    it('should maintain proper prototype chain for instanceof checks', () => {
      const error = new SystemLoadError('Test')
      
      expect(error instanceof Error).toBe(true)
      expect(error instanceof ChartCitizenError).toBe(true)
      expect(error instanceof SystemLoadError).toBe(true)
    })
  })

  describe('Error Type Guards', () => {
    it('should correctly identify ChartCitizenError', () => {
      const customError = new SystemLoadError('Test')
      const regularError = new Error('Test')

      expect(isChartCitizenError(customError)).toBe(true)
      expect(isChartCitizenError(regularError)).toBe(false)
      expect(isChartCitizenError('not an error')).toBe(false)
    })

    it('should correctly identify system errors', () => {
      const systemError = new SystemLoadError('Test')
      const networkError = new NetworkError('Test')

      expect(isSystemError(systemError)).toBe(true)
      expect(isSystemError(networkError)).toBe(false)
    })

    it('should correctly identify network errors', () => {
      const networkError = new NetworkError('Test')
      const systemError = new SystemLoadError('Test')

      expect(isNetworkError(networkError)).toBe(true)
      expect(isNetworkError(systemError)).toBe(false)
    })

    it('should correctly identify validation errors', () => {
      const validationError = new ValidationError('Test')
      const dataParsingError = new DataParsingError('Test')
      const userInputError = new UserInputError('Test')
      const systemError = new SystemLoadError('Test')

      expect(isValidationError(validationError)).toBe(true)
      expect(isValidationError(dataParsingError)).toBe(true)
      expect(isValidationError(userInputError)).toBe(true)
      expect(isValidationError(systemError)).toBe(false)
    })

    it('should correctly identify rendering errors', () => {
      const renderingError = new RenderingError('Test')
      const webglError = new WebGLError('Test')
      const systemError = new SystemLoadError('Test')

      expect(isRenderingError(renderingError)).toBe(true)
      expect(isRenderingError(webglError)).toBe(true)
      expect(isRenderingError(systemError)).toBe(false)
    })
  })

  describe('Error Context Handling', () => {
    it.todo('should handle complex context objects')
    it.todo('should serialize context properly')
    it.todo('should handle circular references in context')
    it.todo('should validate context size limits')
  })

  describe('Error Stack Traces', () => {
    it.todo('should preserve original stack traces')
    it.todo('should handle nested error stacks')
    it.todo('should format stack traces consistently')
    it.todo('should handle async operation stacks')
  })
}) 