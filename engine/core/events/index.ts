/**
 * Event-Driven Architecture - Public API
 * ======================================
 * 
 * Clean exports for the event-driven architecture system.
 * Provides everything needed to integrate with existing Chart Citizen patterns.
 */

// Core event system
export { EventBus, globalEventBus, emitEvent, subscribeToEvent, subscribeToEventType } from './event-bus';
export { CoordinationService } from './coordination-handlers';

// Event types and utilities
export type {
  SystemEvent,
  EventListener,
  EventFilter,
  IEventBus,
  EventBusStatistics,
  SubscriptionOptions,
  
  // Specific event types for external use
  ViewModeChangeRequestedEvent,
  ViewModeChangeStartedEvent,
  ViewModeChangeCompletedEvent,
  ObjectFocusRequestedEvent,
  ObjectFocusStartedEvent,
  ObjectFocusCompletedEvent,
  ObjectSelectionChangedEvent,
  ObjectHoverChangedEvent,
  CameraAnimationStartedEvent,
  CameraAnimationCompletedEvent,
  CameraStateChangedEvent,
  TimeControlChangeRequestedEvent,
  TimeControlChangedEvent,
  CalculationRequestedEvent,
  CalculationStartedEvent,
  CalculationCompletedEvent,
  SystemInitializedEvent,
  SystemErrorEvent,
  CacheInvalidatedEvent,
  PerformanceThresholdExceededEvent
} from './event-types';

export {
  createEvent,
  isViewModeEvent,
  isObjectEvent,
  isCameraEvent,
  isTimeControlEvent,
  isCalculationEvent,
  isSystemEvent
} from './event-types';

// React integration hooks
export {
  useEventSubscription,
  useEventEmitter,
  useObjectSelectionEvents,
  useViewModeEvents,
  useTimeControlEvents,
  useEventMonitoring,
  useCameraEvents,
  EventBusProvider,
  useEventBus
} from './react-integration';

/**
 * Quick start function for initializing the event-driven architecture
 */
export function initializeEventDrivenArchitecture(): {
  eventBus: EventBus;
  coordinationService: CoordinationService;
} {
  const eventBus = globalEventBus;
  const coordinationService = new CoordinationService(eventBus);
  
  console.log('🚀 Event-driven architecture initialized');
  
  return {
    eventBus,
    coordinationService
  };
}

/**
 * Utility for graceful shutdown
 */
export function shutdownEventDrivenArchitecture(coordinationService: CoordinationService): void {
  coordinationService.shutdown();
  globalEventBus.clear();
  console.log('🛑 Event-driven architecture shut down');
}