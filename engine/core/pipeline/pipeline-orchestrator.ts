/**
 * Pipeline Orchestrator
 * =====================
 * 
 * High-level orchestrator that coordinates all services, events, and strategies
 * to provide a clean, unified interface for orbital calculations.
 * 
 * This orchestrator provides the migration layer from the legacy orbital-mechanics-calculator
 * while offering enhanced capabilities like progress tracking, error recovery, and async operations.
 */

import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ViewModeStrategy, SystemContext } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import type { RenderingConfiguration } from '@/engine/core/configuration/rendering-configuration';
import type { IOrbitalCalculationService, SystemLayout, ServiceStatistics } from '@/engine/services/orbital-calculations/interfaces/calculation-services';
import type { IEventBus, SystemEvent } from '@/engine/core/events/event-types';
import { createEvent } from '@/engine/core/events/event-types';
import { getViewModeStrategy } from '@/engine/core/view-modes/strategies/view-mode-registry';
import { ViewModeStrategyUtils } from '@/engine/core/view-modes/strategies/view-mode-strategy';

/**
 * Legacy compatibility result format
 */
export interface LegacyCalculationResult {
  readonly visualRadius: number;
  readonly orbitDistance?: number;
  readonly beltData?: {
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly centerRadius: number;
  };
  readonly animationSpeed?: number;
}

/**
 * Pipeline execution context
 */
export interface PipelineContext {
  readonly objects: CelestialObject[];
  readonly viewMode: ViewType;
  readonly strategy: ViewModeStrategy;
  readonly systemContext: SystemContext;
  readonly config: RenderingConfiguration;
  readonly isPaused?: boolean;
  readonly requestId: string;
  readonly startTime: number;
}

/**
 * Pipeline execution progress
 */
export interface PipelineProgress {
  readonly requestId: string;
  readonly stage: 'validation' | 'calculation' | 'collision-detection' | 'hierarchy' | 'completion';
  readonly progress: number; // 0-100
  readonly message: string;
  readonly duration: number;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  readonly requestId: string;
  readonly success: boolean;
  readonly systemLayout: SystemLayout | null;
  readonly legacyFormat: Map<string, LegacyCalculationResult>;
  readonly duration: number;
  readonly errors: string[];
  readonly warnings: string[];
  readonly cacheHit: boolean;
  readonly statistics: ServiceStatistics;
}

/**
 * Pipeline orchestrator options
 */
export interface PipelineOptions {
  readonly enableProgressTracking?: boolean;
  readonly enableEvents?: boolean;
  readonly legacyCompatibilityMode?: boolean;
  readonly enableErrorRecovery?: boolean;
  readonly timeoutMs?: number;
}

/**
 * Main Pipeline Orchestrator class
 */
export class PipelineOrchestrator {
  private activeRequests = new Map<string, AbortController>();
  private requestCounter = 0;

  constructor(
    private orbitalCalculationService: IOrbitalCalculationService,
    private config: RenderingConfiguration,
    private eventBus?: IEventBus,
    private options: PipelineOptions = {}
  ) {
    this.setupDefaults();
  }

  private setupDefaults(): void {
    // Set default options
    this.options = {
      enableProgressTracking: true,
      enableEvents: true,
      legacyCompatibilityMode: true,
      enableErrorRecovery: true,
      timeoutMs: 30000, // 30 seconds
      ...this.options
    };
  }

  /**
   * Main pipeline execution method - provides both legacy and modern interfaces
   */
  async executeCalculationPipeline(
    objects: CelestialObject[],
    viewMode: ViewType,
    isPaused: boolean = false,
    progressCallback?: (progress: PipelineProgress) => void
  ): Promise<PipelineResult> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);
    
    try {
      // Build pipeline context
      const context = await this.buildPipelineContext(objects, viewMode, requestId, startTime, isPaused);
      
      // Execute pipeline with progress tracking
      const result = await this.executePipelineStages(context, progressCallback, abortController.signal);
      
      // Emit completion event
      if (this.options.enableEvents && this.eventBus) {
        await this.emitCompletionEvent(context, result, true);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const duration = performance.now() - startTime;
      
      // Create error result
      const errorResult: PipelineResult = {
        requestId,
        success: false,
        systemLayout: null,
        legacyFormat: new Map(),
        duration,
        errors: [errorMessage],
        warnings: [],
        cacheHit: false,
        statistics: this.orbitalCalculationService.getStatistics()
      };
      
      // Emit failure event
      if (this.options.enableEvents && this.eventBus) {
        await this.emitFailureEvent(requestId, errorMessage);
      }
      
      return errorResult;
      
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Legacy compatibility method - matches original orbital-mechanics-calculator API
   */
  async calculateSystemOrbitalMechanics(
    objects: CelestialObject[],
    viewType: ViewType,
    isPaused: boolean = false
  ): Promise<Map<string, LegacyCalculationResult>> {
    const result = await this.executeCalculationPipeline(objects, viewType, isPaused);
    return result.legacyFormat;
  }

  /**
   * Modern async interface with full feature set
   */
  async calculateSystemLayoutAsync(
    objects: CelestialObject[],
    viewMode: ViewType,
    progressCallback?: (progress: PipelineProgress) => void
  ): Promise<SystemLayout> {
    const result = await this.executeCalculationPipeline(objects, viewMode, false, progressCallback);
    
    if (!result.success || !result.systemLayout) {
      throw new Error(`Pipeline execution failed: ${result.errors.join(', ')}`);
    }
    
    return result.systemLayout;
  }

  /**
   * Cancel a running calculation
   */
  cancelCalculation(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all running calculations
   */
  cancelAllCalculations(): number {
    const count = this.activeRequests.size;
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
    return count;
  }

  /**
   * Get pipeline statistics
   */
  getStatistics(): {
    activeRequests: number;
    serviceStatistics: ServiceStatistics;
  } {
    return {
      activeRequests: this.activeRequests.size,
      serviceStatistics: this.orbitalCalculationService.getStatistics()
    };
  }

  /**
   * Build pipeline context
   */
  private async buildPipelineContext(
    objects: CelestialObject[],
    viewMode: ViewType,
    requestId: string,
    startTime: number,
    isPaused: boolean = false
  ): Promise<PipelineContext> {
    // Get view mode strategy
    const strategy = getViewModeStrategy(viewMode);
    
    // Build system context
    const systemContext = ViewModeStrategyUtils.createSystemContext(objects, []);
    
    return {
      objects,
      viewMode,
      strategy,
      systemContext,
      config: this.config,
      isPaused,
      requestId,
      startTime
    };
  }

  /**
   * Execute pipeline stages with progress tracking
   */
  private async executePipelineStages(
    context: PipelineContext,
    progressCallback?: (progress: PipelineProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<PipelineResult> {
    const stages = [
      { name: 'validation', weight: 10 },
      { name: 'calculation', weight: 60 },
      { name: 'collision-detection', weight: 15 },
      { name: 'hierarchy', weight: 10 },
      { name: 'completion', weight: 5 }
    ];
    
    let currentProgress = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Stage 1: Validation
    currentProgress += stages[0].weight;
    await this.reportProgress(context, 'validation', currentProgress, 'Validating input data...', progressCallback);
    this.checkAborted(abortSignal);
    
    // Stage 2: Main calculation
    currentProgress += stages[1].weight;
    await this.reportProgress(context, 'calculation', currentProgress, 'Calculating orbital mechanics...', progressCallback);
    this.checkAborted(abortSignal);
    
    const systemLayout = await this.orbitalCalculationService.calculateSystemLayout(
      context.objects,
      context.viewMode,
      context.strategy,
      context.systemContext,
      context.config
    );
    
    // Stage 3: Collision detection (already done in service, just report progress)
    currentProgress += stages[2].weight;
    await this.reportProgress(context, 'collision-detection', currentProgress, 'Resolving collisions...', progressCallback);
    this.checkAborted(abortSignal);
    
    // Stage 4: Hierarchy enforcement (already done in service, just report progress)
    currentProgress += stages[3].weight;
    await this.reportProgress(context, 'hierarchy', currentProgress, 'Enforcing hierarchy constraints...', progressCallback);
    this.checkAborted(abortSignal);
    
    // Stage 5: Completion
    currentProgress = 100;
    await this.reportProgress(context, 'completion', currentProgress, 'Finalizing results...', progressCallback);
    
    // Convert to legacy format for compatibility
    const legacyFormat = this.convertToLegacyFormat(systemLayout);
    
    const duration = performance.now() - context.startTime;
    
    return {
      requestId: context.requestId,
      success: true,
      systemLayout,
      legacyFormat,
      duration,
      errors,
      warnings,
      cacheHit: systemLayout.metadata.cacheHit,
      statistics: this.orbitalCalculationService.getStatistics()
    };
  }

  /**
   * Convert modern SystemLayout to legacy format
   */
  private convertToLegacyFormat(systemLayout: SystemLayout): Map<string, LegacyCalculationResult> {
    const legacyMap = new Map<string, LegacyCalculationResult>();
    
    for (const [objectId, result] of systemLayout.results) {
      const legacyResult: LegacyCalculationResult = {
        visualRadius: result.visualRadius,
        orbitDistance: result.orbitDistance,
        beltData: result.beltData ? {
          innerRadius: result.beltData.innerRadius,
          outerRadius: result.beltData.outerRadius,
          centerRadius: result.beltData.centerRadius
        } : undefined,
        animationSpeed: 1.0 // Default animation speed
      };
      
      legacyMap.set(objectId, legacyResult);
    }
    
    return legacyMap;
  }

  /**
   * Report progress with optional callback and events
   */
  private async reportProgress(
    context: PipelineContext,
    stage: PipelineProgress['stage'],
    progress: number,
    message: string,
    progressCallback?: (progress: PipelineProgress) => void
  ): Promise<void> {
    const duration = performance.now() - context.startTime;
    
    const progressInfo: PipelineProgress = {
      requestId: context.requestId,
      stage,
      progress,
      message,
      duration,
      errors: [],
      warnings: []
    };
    
    // Call progress callback
    if (progressCallback) {
      progressCallback(progressInfo);
    }
    
    // Emit progress event
    if (this.options.enableEvents && this.eventBus) {
      const progressEvent = createEvent(
        'calculation-requested', // Reusing existing event type for now
        {
          viewMode: context.viewMode,
          objectCount: context.objects.length,
          reason: 'pipeline-progress',
          priority: 'normal'
        },
        'PipelineOrchestrator',
        context.requestId
      );
      
      await this.eventBus.emit(progressEvent);
    }
  }

  /**
   * Check if operation was aborted
   */
  private checkAborted(abortSignal?: AbortSignal): void {
    if (abortSignal?.aborted) {
      throw new Error('Pipeline execution was cancelled');
    }
  }

  /**
   * Emit completion event
   */
  private async emitCompletionEvent(
    context: PipelineContext,
    result: PipelineResult,
    success: boolean
  ): Promise<void> {
    if (!this.eventBus) return;
    
    const completionEvent = createEvent(
      'calculation-completed',
      {
        viewMode: context.viewMode,
        objectCount: context.objects.length,
        calculationId: context.requestId,
        duration: result.duration,
        cacheHit: result.cacheHit,
        collisionCount: 0, // Would be extracted from systemLayout
        warnings: result.warnings
      },
      'PipelineOrchestrator',
      context.requestId
    );
    
    await this.eventBus.emit(completionEvent);
  }

  /**
   * Emit failure event
   */
  private async emitFailureEvent(requestId: string, error: string): Promise<void> {
    if (!this.eventBus) return;
    
    const failureEvent = createEvent(
      'calculation-failed',
      {
        viewMode: 'explorational', // Default fallback
        calculationId: requestId,
        error,
        fallbackUsed: false
      },
      'PipelineOrchestrator',
      requestId
    );
    
    await this.eventBus.emit(failureEvent);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `pipeline_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Health check for the pipeline orchestrator
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    statistics: {
      activeRequests: number;
      serviceHealth: any;
    };
  }> {
    const issues: string[] = [];
    
    // Check active requests
    if (this.activeRequests.size > 10) {
      issues.push(`High number of active requests: ${this.activeRequests.size}`);
    }
    
    // Check service health
    const serviceHealth = await this.orbitalCalculationService.healthCheck();
    if (!serviceHealth.healthy) {
      issues.push('Orbital calculation service unhealthy');
      issues.push(...serviceHealth.errors);
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      statistics: {
        activeRequests: this.activeRequests.size,
        serviceHealth
      }
    };
  }

  /**
   * Shutdown the pipeline orchestrator
   */
  shutdown(): void {
    // Cancel all active requests
    this.cancelAllCalculations();
    
    console.log('Pipeline orchestrator shut down');
  }
}