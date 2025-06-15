export abstract class ChartCitizenError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'SYSTEM' | 'NETWORK' | 'VALIDATION' | 'RENDERING' | 'USER';
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

export class SystemLoadError extends ChartCitizenError {
  readonly code = 'SYSTEM_LOAD_FAILED';
  readonly category = 'SYSTEM' as const;
}

export class NetworkError extends ChartCitizenError {
  readonly code = 'NETWORK_ERROR';
  readonly category = 'NETWORK' as const;
}

export class ValidationError extends ChartCitizenError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'VALIDATION' as const;
}

export class RenderingError extends ChartCitizenError {
  readonly code = 'RENDERING_ERROR';
  readonly category = 'RENDERING' as const;
}

export class UserInputError extends ChartCitizenError {
  readonly code = 'USER_INPUT_ERROR';
  readonly category = 'USER' as const;
}

export class ConfigurationError extends ChartCitizenError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly category = 'SYSTEM' as const;
}

export class DataParsingError extends ChartCitizenError {
  readonly code = 'DATA_PARSING_ERROR';
  readonly category = 'VALIDATION' as const;
}

export class WebGLError extends ChartCitizenError {
  readonly code = 'WEBGL_ERROR';
  readonly category = 'RENDERING' as const;
}

// Utility function to create errors with context
export function createError<T extends ChartCitizenError>(
  ErrorClass: new (message: string, context?: Record<string, unknown>) => T,
  message: string,
  context?: Record<string, unknown>
): T {
  return new ErrorClass(message, context);
}

// Type guards for error handling
export function isChartCitizenError(error: unknown): error is ChartCitizenError {
  return error instanceof ChartCitizenError;
}

export function isSystemError(error: unknown): error is SystemLoadError | ConfigurationError {
  return error instanceof SystemLoadError || error instanceof ConfigurationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isValidationError(error: unknown): error is ValidationError | DataParsingError {
  return error instanceof ValidationError || error instanceof DataParsingError;
}

export function isRenderingError(error: unknown): error is RenderingError | WebGLError {
  return error instanceof RenderingError || error instanceof WebGLError;
} 