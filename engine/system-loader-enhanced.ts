import { EngineSystemLoader } from './system-loader';
import { OrbitalSystemData } from './types/orbital-system';
import { SystemLoadError, NetworkError, DataParsingError } from './types/errors';
import { errorReporter } from './services/error-reporter';
import { Validator, assertValidSystemId, assertValidViewMode } from './validation/validators';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface LoadAttempt {
  attempt: number;
  timestamp: Date;
  error?: Error;
  duration?: number;
}

export class EnhancedSystemLoader extends EngineSystemLoader {
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private loadAttempts: Map<string, LoadAttempt[]> = new Map();
  private failedSystems: Set<string> = new Set();

  constructor(retryConfig?: Partial<RetryConfig>) {
    super();
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
  }

  async loadSystemWithRetry(mode: string, systemId: string): Promise<OrbitalSystemData | null> {
    // Validate inputs
    try {
      assertValidViewMode(mode);
      assertValidSystemId(systemId);
    } catch (error) {
      errorReporter.report(error as Error, { mode, systemId, operation: 'loadSystemWithRetry' });
      throw error;
    }

    const cacheKey = `${mode}:${systemId}`;
    
    // Check if system has permanently failed
    if (this.failedSystems.has(cacheKey)) {
      throw new SystemLoadError(
        `System ${systemId} has been marked as permanently failed`,
        { mode, systemId, permanentFailure: true }
      );
    }

    // Initialize attempt tracking
    if (!this.loadAttempts.has(cacheKey)) {
      this.loadAttempts.set(cacheKey, []);
    }

    const attempts = this.loadAttempts.get(cacheKey)!;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      const startTime = Date.now();
      const attemptRecord: LoadAttempt = {
        attempt,
        timestamp: new Date()
      };

      try {
        // Update error reporter context
        errorReporter.updateSystemContext(systemId, mode);

        // Try to load the system
        const result = await this.loadSystem(mode, systemId);
        
        if (result) {
          // Success - record the attempt and return
          attemptRecord.duration = Date.now() - startTime;
          attempts.push(attemptRecord);
          
          // Clear any previous failure record
          this.failedSystems.delete(cacheKey);
          
          console.log(`✅ System ${systemId} loaded successfully on attempt ${attempt + 1}`);
          return result;
        } else {
          // System returned null - treat as not found
          throw new SystemLoadError(
            `System ${systemId} not found or returned null`,
            { mode, systemId, attempt }
          );
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attemptRecord.error = lastError;
        attemptRecord.duration = Date.now() - startTime;
        attempts.push(attemptRecord);

        // Categorize the error
        const categorizedError = this.categorizeError(lastError, mode, systemId);
        
        // Report error with attempt context
        errorReporter.report(categorizedError, {
          mode,
          systemId,
          attempt,
          maxRetries: this.retryConfig.maxRetries,
          attemptDuration: attemptRecord.duration
        });

        // Check if we should retry
        if (attempt === this.retryConfig.maxRetries) {
          // Final attempt failed
          this.failedSystems.add(cacheKey);
          
          throw new SystemLoadError(
            `Failed to load system ${systemId} after ${this.retryConfig.maxRetries + 1} attempts`,
            { 
              mode, 
              systemId, 
              attempts: attempts.length,
              lastError: lastError.message,
              allAttempts: attempts.map(a => ({
                attempt: a.attempt,
                timestamp: a.timestamp.toISOString(),
                duration: a.duration,
                error: a.error?.message
              }))
            }
          );
        }

        // Don't retry certain types of errors
        if (this.shouldNotRetry(categorizedError)) {
          this.failedSystems.add(cacheKey);
          throw categorizedError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        console.warn(`⚠️ Attempt ${attempt + 1} failed for system ${systemId}, retrying in ${delay}ms...`);
        
        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    throw new SystemLoadError(
      `Unexpected error in retry logic for system ${systemId}`,
      { mode, systemId, lastError: lastError?.message }
    );
  }

  private categorizeError(error: Error, mode: string, systemId: string): Error {
    const message = error.message.toLowerCase();
    
    // Network-related errors
    if (message.includes('fetch') || 
        message.includes('network') || 
        message.includes('timeout') ||
        message.includes('connection')) {
      return new NetworkError(
        `Network error loading system ${systemId}: ${error.message}`,
        { mode, systemId, originalError: error.message }
      );
    }

    // HTTP errors
    if (message.includes('http') && (message.includes('500') || message.includes('502') || message.includes('503'))) {
      return new NetworkError(
        `Server error loading system ${systemId}: ${error.message}`,
        { mode, systemId, originalError: error.message }
      );
    }

    // 404 errors - don't retry
    if (message.includes('404') || message.includes('not found')) {
      return new SystemLoadError(
        `System ${systemId} not found: ${error.message}`,
        { mode, systemId, originalError: error.message, permanent: true }
      );
    }

    // JSON parsing errors
    if (message.includes('json') || message.includes('parse') || message.includes('syntax')) {
      return new DataParsingError(
        `Invalid system data for ${systemId}: ${error.message}`,
        { mode, systemId, originalError: error.message }
      );
    }

    // Validation errors
    if (message.includes('invalid') && message.includes('system')) {
      return new DataParsingError(
        `System validation failed for ${systemId}: ${error.message}`,
        { mode, systemId, originalError: error.message }
      );
    }

    // Default to system load error
    return new SystemLoadError(
      `Failed to load system ${systemId}: ${error.message}`,
      { mode, systemId, originalError: error.message }
    );
  }

  private shouldNotRetry(error: Error): boolean {
    // Don't retry validation errors, 404s, or permanent failures
    return error instanceof DataParsingError ||
           (error instanceof SystemLoadError && (error.context as any)?.permanent) ||
           error.message.includes('404') ||
           error.message.includes('not found') ||
           error.message.includes('invalid system id') ||
           error.message.includes('invalid view mode');
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced validation with detailed error reporting
  public validateSystemDataEnhanced(systemData: OrbitalSystemData): boolean {
    try {
      const validationResult = Validator.validateSystemData(systemData);
      
      if (!validationResult.isValid) {
        console.error('❌ System validation failed:', validationResult.errors);
        
        // Report validation errors
        errorReporter.report(
          new DataParsingError(
            `System validation failed: ${validationResult.errors.join(', ')}`,
            { systemData: systemData.id, errors: validationResult.errors }
          )
        );
        
        return false;
      }

      // Log warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('⚠️ System validation warnings:', validationResult.warnings);
      }

      return true;
    } catch (error) {
      console.error('❌ Error during system validation:', error);
      errorReporter.report(error as Error, { systemData: systemData.id });
      return false;
    }
  }

  // Enhanced starmap loading with retry logic
  async loadStarmapWithRetry(mode: string): Promise<any> {
    try {
      assertValidViewMode(mode);
    } catch (error) {
      errorReporter.report(error as Error, { mode, operation: 'loadStarmapWithRetry' });
      throw error;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.loadStarmap(mode);
        
        if (result) {
          return result;
        } else {
          throw new SystemLoadError(`Starmap for mode ${mode} returned null`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const categorizedError = this.categorizeError(lastError, mode, 'starmap');
        errorReporter.report(categorizedError, { mode, attempt, operation: 'loadStarmap' });

        if (attempt === this.retryConfig.maxRetries || this.shouldNotRetry(categorizedError)) {
          throw categorizedError;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`⚠️ Starmap load attempt ${attempt + 1} failed for mode ${mode}, retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    throw lastError || new SystemLoadError(`Failed to load starmap for mode ${mode}`);
  }

  // Get retry statistics for monitoring
  getRetryStatistics(): {
    totalAttempts: number;
    failedSystems: number;
    averageAttemptsPerSystem: number;
    systemsWithRetries: number;
  } {
    let totalAttempts = 0;
    let systemsWithRetries = 0;

    for (const attempts of Array.from(this.loadAttempts.values())) {
      totalAttempts += attempts.length;
      if (attempts.length > 1) {
        systemsWithRetries++;
      }
    }

    return {
      totalAttempts,
      failedSystems: this.failedSystems.size,
      averageAttemptsPerSystem: this.loadAttempts.size > 0 ? totalAttempts / this.loadAttempts.size : 0,
      systemsWithRetries
    };
  }

  // Clear failure records (useful for testing or manual retry)
  clearFailureRecords(): void {
    this.failedSystems.clear();
    this.loadAttempts.clear();
  }

  // Check if a system is marked as permanently failed
  isSystemPermanentlyFailed(mode: string, systemId: string): boolean {
    return this.failedSystems.has(`${mode}:${systemId}`);
  }

  // Get attempt history for a system
  getAttemptHistory(mode: string, systemId: string): LoadAttempt[] {
    return this.loadAttempts.get(`${mode}:${systemId}`) || [];
  }
} 