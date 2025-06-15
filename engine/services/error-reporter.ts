import { ChartCitizenError, isChartCitizenError } from '../types/errors';

interface ErrorContext {
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  buildVersion: string;
  viewMode?: string;
  systemId?: string;
  [key: string]: unknown;
}

interface ErrorReport {
  message: string;
  stack?: string;
  name: string;
  code?: string;
  category?: string;
  context: ErrorContext;
  fingerprint: string;
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private context: Partial<ErrorContext> = {};
  private reportQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    this.initializeContext();
    this.setupNetworkListeners();
    this.setupUnhandledErrorListeners();
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  private initializeContext() {
    this.context = {
      sessionId: this.generateSessionId(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      buildVersion: process.env.REACT_APP_VERSION || 'development',
      timestamp: new Date()
    };
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushReportQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private setupUnhandledErrorListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.report(new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          unhandled: true
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.report(error, {
          unhandledPromiseRejection: true
        });
      });
    }
  }

  setContext(context: Partial<ErrorContext>) {
    this.context = { ...this.context, ...context };
  }

  updateSystemContext(systemId: string, viewMode: string) {
    this.setContext({ systemId, viewMode });
  }

  report(error: Error, additionalContext?: Record<string, unknown>) {
    const errorReport = this.createErrorReport(error, additionalContext);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport);
    }

    // Queue for sending to monitoring service
    this.queueReport(errorReport);
  }

  private createErrorReport(error: Error, additionalContext?: Record<string, unknown>): ErrorReport {
    const baseContext: ErrorContext = {
      ...this.context,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : this.context.url || '',
      ...additionalContext
    } as ErrorContext;

    let code: string | undefined;
    let category: string | undefined;

    if (isChartCitizenError(error)) {
      code = error.code;
      category = error.category;
      if (error.context) {
        Object.assign(baseContext, error.context);
      }
    }

    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code,
      category,
      context: baseContext,
      fingerprint: this.generateFingerprint(error, baseContext)
    };

    return errorReport;
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    // Create a unique fingerprint for error deduplication
    const key = `${error.name}:${error.message}:${context.url}:${context.systemId || 'unknown'}`;
    return this.hashString(key);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private queueReport(errorReport: ErrorReport) {
    this.reportQueue.push(errorReport);
    
    if (this.isOnline) {
      this.flushReportQueue();
    }
  }

  private async flushReportQueue() {
    if (this.reportQueue.length === 0) return;

    const reportsToSend = [...this.reportQueue];
    this.reportQueue = [];

    try {
      await this.sendReports(reportsToSend);
    } catch (error) {
      // If sending fails, put reports back in queue
      this.reportQueue.unshift(...reportsToSend);
      console.warn('Failed to send error reports, queued for retry:', error);
    }
  }

  private async sendReports(reports: ErrorReport[]) {
    if (process.env.NODE_ENV !== 'production') {
      return; // Don't send reports in development
    }

    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Re-throw to trigger retry logic
      throw error;
    }
  }

  // Method to manually flush reports (useful for testing)
  async flush(): Promise<void> {
    await this.flushReportQueue();
  }

  // Get current queue size (useful for monitoring)
  getQueueSize(): number {
    return this.reportQueue.length;
  }

  // Clear context (useful for user logout)
  clearUserContext() {
    const { userId, ...contextWithoutUser } = this.context;
    this.context = contextWithoutUser;
  }
}

// Singleton instance
export const errorReporter = ErrorReporter.getInstance(); 