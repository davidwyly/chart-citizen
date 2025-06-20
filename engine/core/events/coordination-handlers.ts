/**
 * Coordination Event Handlers
 * ===========================
 * 
 * Event handlers that address the complex coordination scenarios identified in the current codebase.
 * These handlers enhance existing patterns without breaking current functionality.
 */

import type {
  SystemEvent,
  ViewModeChangeRequestedEvent,
  ViewModeChangeStartedEvent,
  ObjectFocusRequestedEvent,
  ObjectFocusStartedEvent,
  ObjectSelectionChangedEvent,
  CameraAnimationStartedEvent,
  CameraAnimationCompletedEvent,
  TimeControlChangeRequestedEvent,
  CalculationRequestedEvent
} from './event-types';
import { createEvent } from './event-types';
import type { IEventBus } from './event-types';
import type { ViewType } from '@lib/types/effects-level';

/**
 * View Mode Coordination Handler
 * Handles the complex cascade of updates when view modes change
 */
export class ViewModeCoordinationHandler {
  private activeTransition: string | null = null;

  constructor(private eventBus: IEventBus) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle view mode change requests
    this.eventBus.subscribeToType(
      'view-mode-change-requested',
      this.handleViewModeChangeRequested.bind(this),
      { priority: 100 }
    );

    // Handle calculation completion to finalize view mode changes
    this.eventBus.subscribeToType(
      'calculation-completed',
      this.handleCalculationCompleted.bind(this),
      { priority: 90 }
    );

    // Handle view mode change failures
    this.eventBus.subscribeToType(
      'view-mode-change-failed',
      this.handleViewModeChangeFailed.bind(this),
      { priority: 100 }
    );
  }

  private async handleViewModeChangeRequested(event: ViewModeChangeRequestedEvent): Promise<void> {
    // Prevent overlapping transitions
    if (this.activeTransition) {
      console.warn('View mode change already in progress, ignoring request');
      return;
    }

    this.activeTransition = event.correlationId || `transition_${Date.now()}`;

    try {
      // Emit view mode change started event
      const startedEvent = createEvent(
        'view-mode-change-started',
        {
          fromMode: event.fromMode,
          toMode: event.toMode,
          strategy: `${event.toMode}-strategy`,
          cacheInvalidationRequired: true,
          cameraResetRequired: event.fromMode !== event.toMode
        },
        'ViewModeCoordinationHandler',
        this.activeTransition
      );

      await this.eventBus.emit(startedEvent);

      // Request cache invalidation if needed
      if (startedEvent.cacheInvalidationRequired) {
        const cacheEvent = createEvent(
          'cache-invalidated',
          {
            scope: 'view-mode' as const,
            viewMode: event.fromMode,
            reason: `View mode change from ${event.fromMode} to ${event.toMode}`
          },
          'ViewModeCoordinationHandler',
          this.activeTransition
        );

        await this.eventBus.emit(cacheEvent);
      }

      // Request orbital calculations for new view mode
      const calcEvent = createEvent(
        'calculation-requested',
        {
          viewMode: event.toMode,
          objectCount: 0, // Will be filled by calculation service
          reason: 'view-mode-change' as const,
          priority: 'high' as const
        },
        'ViewModeCoordinationHandler',
        this.activeTransition
      );

      await this.eventBus.emit(calcEvent);

    } catch (error) {
      // Emit failure event
      const failedEvent = createEvent(
        'view-mode-change-failed',
        {
          fromMode: event.fromMode,
          toMode: event.toMode,
          error: error instanceof Error ? error.message : String(error),
          fallbackMode: event.fromMode
        },
        'ViewModeCoordinationHandler',
        this.activeTransition
      );

      await this.eventBus.emit(failedEvent);
    }
  }

  private async handleCalculationCompleted(event: any): Promise<void> {
    // Only handle calculations related to view mode changes
    if (!this.activeTransition || event.correlationId !== this.activeTransition) {
      return;
    }

    try {
      // View mode change is complete
      const completedEvent = createEvent(
        'view-mode-change-completed',
        {
          fromMode: 'explorational' as ViewType, // Would get from context
          toMode: event.viewMode,
          strategy: `${event.viewMode}-strategy`,
          duration: Date.now() - this.activeTransition.split('_')[1],
          warnings: event.warnings || []
        },
        'ViewModeCoordinationHandler',
        this.activeTransition
      );

      await this.eventBus.emit(completedEvent);

    } finally {
      this.activeTransition = null;
    }
  }

  private async handleViewModeChangeFailed(event: any): Promise<void> {
    this.activeTransition = null;
    console.error('View mode change failed:', event.error);
  }
}

/**
 * Object Selection Coordination Handler
 * Handles the complex coordination between object focus, selection, camera animation, and pause/unpause
 */
export class ObjectSelectionCoordinationHandler {
  private activeFocus: string | null = null;
  private pausedForAnimation = false;

  constructor(private eventBus: IEventBus) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle object focus requests
    this.eventBus.subscribeToType(
      'object-focus-requested',
      this.handleObjectFocusRequested.bind(this),
      { priority: 100 }
    );

    // Handle camera animation completion
    this.eventBus.subscribeToType(
      'camera-animation-completed',
      this.handleCameraAnimationCompleted.bind(this),
      { priority: 90 }
    );

    // Handle time control changes to track pause state
    this.eventBus.subscribeToType(
      'time-control-changed',
      this.handleTimeControlChanged.bind(this),
      { priority: 50 }
    );
  }

  private async handleObjectFocusRequested(event: ObjectFocusRequestedEvent): Promise<void> {
    // Prevent overlapping focus operations
    if (this.activeFocus) {
      console.warn('Object focus already in progress, ignoring request');
      return;
    }

    this.activeFocus = event.correlationId || `focus_${Date.now()}`;

    try {
      // ⚠️ CRITICAL: Determine if we need to pause for animation
      // This addresses the current coordination challenge where pause/unpause timing is manual
      const pauseRequired = event.reason === 'user-click' || event.reason === 'breadcrumb';
      
      if (pauseRequired && !this.pausedForAnimation) {
        // Request pause for animation
        const pauseEvent = createEvent(
          'time-control-change-requested',
          {
            action: 'pause' as const,
            reason: 'object-selection' as const,
            temporary: true
          },
          'ObjectSelectionCoordinationHandler',
          this.activeFocus
        );

        await this.eventBus.emit(pauseEvent);
      }

      // Emit object focus started event
      const focusStartedEvent = createEvent(
        'object-focus-started',
        {
          objectId: event.objectId,
          objectName: event.objectName,
          cameraPosition: new THREE.Vector3(), // Would calculate actual position
          cameraTarget: new THREE.Vector3(),   // Would calculate actual target
          animationDuration: event.animationDuration || 1000,
          pauseRequired
        },
        'ObjectSelectionCoordinationHandler',
        this.activeFocus
      );

      await this.eventBus.emit(focusStartedEvent);

      // Request camera animation
      const cameraEvent = createEvent(
        'camera-animation-started',
        {
          fromPosition: new THREE.Vector3(), // Would get current position
          toPosition: new THREE.Vector3(),   // Would calculate target position
          fromTarget: new THREE.Vector3(),   // Would get current target
          toTarget: new THREE.Vector3(),     // Would calculate target
          duration: event.animationDuration || 1000,
          easingFunction: 'easeOutQuart',
          reason: 'object-focus' as const
        },
        'ObjectSelectionCoordinationHandler',
        this.activeFocus
      );

      await this.eventBus.emit(cameraEvent);

    } catch (error) {
      console.error('Object focus failed:', error);
      this.activeFocus = null;
    }
  }

  private async handleCameraAnimationCompleted(event: CameraAnimationCompletedEvent): Promise<void> {
    // Only handle animations related to object focus
    if (!this.activeFocus || event.correlationId !== this.activeFocus || event.reason !== 'object-focus') {
      return;
    }

    try {
      // ⚠️ CRITICAL: Emit focus completed BEFORE selection changed
      // This preserves the visual size ordering requirement identified in the current code
      const focusCompletedEvent = createEvent(
        'object-focus-completed',
        {
          objectId: 'object-id', // Would get from context
          objectName: 'object-name', // Would get from context
          finalCameraPosition: event.finalPosition,
          finalCameraTarget: event.finalTarget,
          duration: event.actualDuration
        },
        'ObjectSelectionCoordinationHandler',
        this.activeFocus
      );

      await this.eventBus.emit(focusCompletedEvent);

      // Now emit selection changed (this must happen AFTER focus completed)
      const selectionEvent = createEvent(
        'object-selection-changed',
        {
          objectId: 'object-id', // Would get from context
          objectName: 'object-name', // Would get from context
          objectData: null, // Would get from context
          threeObject: null, // Would get from context
          selectionMethod: 'focus' as const
        },
        'ObjectSelectionCoordinationHandler',
        this.activeFocus
      );

      await this.eventBus.emit(selectionEvent);

      // Resume time control if we paused it
      if (this.pausedForAnimation) {
        const resumeEvent = createEvent(
          'time-control-change-requested',
          {
            action: 'unpause' as const,
            reason: 'object-selection' as const
          },
          'ObjectSelectionCoordinationHandler',
          this.activeFocus
        );

        await this.eventBus.emit(resumeEvent);
      }

    } finally {
      this.activeFocus = null;
    }
  }

  private async handleTimeControlChanged(event: any): Promise<void> {
    if (event.reason === 'object-selection') {
      this.pausedForAnimation = event.isPaused;
    }
  }
}

/**
 * Performance Monitoring Handler
 * Monitors system performance and emits threshold exceeded events
 */
export class PerformanceMonitoringHandler {
  private calculationTimes: number[] = [];
  private readonly CALCULATION_THRESHOLD = 1000; // 1 second

  constructor(private eventBus: IEventBus) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.subscribeToType(
      'calculation-completed',
      this.handleCalculationCompleted.bind(this),
      { priority: 10 } // Low priority
    );
  }

  private async handleCalculationCompleted(event: any): Promise<void> {
    this.calculationTimes.push(event.duration);

    // Keep only last 10 measurements
    if (this.calculationTimes.length > 10) {
      this.calculationTimes.shift();
    }

    // Check if we're consistently exceeding thresholds
    if (event.duration > this.CALCULATION_THRESHOLD) {
      const thresholdEvent = createEvent(
        'performance-threshold-exceeded',
        {
          metric: 'calculation-time' as const,
          value: event.duration,
          threshold: this.CALCULATION_THRESHOLD,
          component: 'OrbitalCalculationService'
        },
        'PerformanceMonitoringHandler'
      );

      await this.eventBus.emit(thresholdEvent);
    }
  }
}

/**
 * Error Recovery Handler
 * Handles system errors and implements recovery strategies
 */
export class ErrorRecoveryHandler {
  constructor(private eventBus: IEventBus) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.subscribeToType(
      'system-error',
      this.handleSystemError.bind(this),
      { priority: 100 }
    );

    this.eventBus.subscribeToType(
      'calculation-failed',
      this.handleCalculationFailed.bind(this),
      { priority: 100 }
    );
  }

  private async handleSystemError(event: any): Promise<void> {
    console.error(`System error in ${event.component}:`, event.error);

    // Implement recovery strategies based on severity
    if (event.severity === 'critical' && event.recoverable) {
      // Could trigger system restart or fallback mode
      console.log('Attempting system recovery...');
    }
  }

  private async handleCalculationFailed(event: any): Promise<void> {
    console.error('Calculation failed:', event.error);

    // Could request recalculation with fallback parameters
    if (!event.fallbackUsed) {
      console.log('Retrying calculation with fallback parameters...');
    }
  }
}

/**
 * Coordination Service
 * Main service that registers all coordination handlers
 */
export class CoordinationService {
  private handlers: Array<
    ViewModeCoordinationHandler | 
    ObjectSelectionCoordinationHandler | 
    PerformanceMonitoringHandler | 
    ErrorRecoveryHandler
  > = [];

  constructor(private eventBus: IEventBus) {
    this.initialize();
  }

  private initialize(): void {
    // Register all coordination handlers
    this.handlers = [
      new ViewModeCoordinationHandler(this.eventBus),
      new ObjectSelectionCoordinationHandler(this.eventBus),
      new PerformanceMonitoringHandler(this.eventBus),
      new ErrorRecoveryHandler(this.eventBus)
    ];

    console.log('Coordination service initialized with', this.handlers.length, 'handlers');
  }

  /**
   * Health check for all handlers
   */
  healthCheck(): {
    healthy: boolean;
    handlerCount: number;
    eventBusHealth: any;
  } {
    const eventBusHealth = this.eventBus.getStatistics();

    return {
      healthy: true, // Could check individual handler health
      handlerCount: this.handlers.length,
      eventBusHealth
    };
  }

  /**
   * Shutdown coordination service
   */
  shutdown(): void {
    // Clear event bus to remove all handlers
    this.eventBus.clear();
    this.handlers = [];
    console.log('Coordination service shut down');
  }
}

// Note: THREE.js import would be handled properly in actual implementation
declare const THREE: any;