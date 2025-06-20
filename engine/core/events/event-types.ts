/**
 * Event Type Definitions
 * ======================
 * 
 * Comprehensive type definitions for the event-driven architecture.
 * These events address the complex coordination scenarios identified in the current codebase.
 */

import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type * as THREE from 'three';

/**
 * Base event interface - all events extend this
 */
export interface BaseEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly source: string;
  readonly correlationId?: string; // For tracking related events
}

/**
 * View Mode Events - Handle view mode transitions and related coordination
 */
export interface ViewModeChangeRequestedEvent extends BaseEvent {
  readonly type: 'view-mode-change-requested';
  readonly fromMode: ViewType;
  readonly toMode: ViewType;
  readonly reason: 'user-action' | 'automatic' | 'system';
  readonly skipValidation?: boolean;
}

export interface ViewModeChangeStartedEvent extends BaseEvent {
  readonly type: 'view-mode-change-started';
  readonly fromMode: ViewType;
  readonly toMode: ViewType;
  readonly strategy: string;
  readonly cacheInvalidationRequired: boolean;
  readonly cameraResetRequired: boolean;
}

export interface ViewModeChangeCompletedEvent extends BaseEvent {
  readonly type: 'view-mode-change-completed';
  readonly fromMode: ViewType;
  readonly toMode: ViewType;
  readonly strategy: string;
  readonly duration: number;
  readonly warnings: string[];
}

export interface ViewModeChangeFailedEvent extends BaseEvent {
  readonly type: 'view-mode-change-failed';
  readonly fromMode: ViewType;
  readonly toMode: ViewType;
  readonly error: string;
  readonly fallbackMode?: ViewType;
}

/**
 * Object Selection Events - Handle complex object selection coordination
 */
export interface ObjectFocusRequestedEvent extends BaseEvent {
  readonly type: 'object-focus-requested';
  readonly objectId: string;
  readonly objectName: string;
  readonly reason: 'user-click' | 'breadcrumb' | 'search' | 'automatic';
  readonly preserveViewMode?: boolean;
  readonly animationDuration?: number;
}

export interface ObjectFocusStartedEvent extends BaseEvent {
  readonly type: 'object-focus-started';
  readonly objectId: string;
  readonly objectName: string;
  readonly previousFocusId?: string;
  readonly cameraPosition: THREE.Vector3;
  readonly cameraTarget: THREE.Vector3;
  readonly animationDuration: number;
  readonly pauseRequired: boolean;
}

export interface ObjectFocusCompletedEvent extends BaseEvent {
  readonly type: 'object-focus-completed';
  readonly objectId: string;
  readonly objectName: string;
  readonly finalCameraPosition: THREE.Vector3;
  readonly finalCameraTarget: THREE.Vector3;
  readonly duration: number;
}

export interface ObjectSelectionChangedEvent extends BaseEvent {
  readonly type: 'object-selection-changed';
  readonly objectId: string | null;
  readonly objectName: string | null;
  readonly objectData: CelestialObject | null;
  readonly threeObject: THREE.Object3D | null;
  readonly previousObjectId?: string | null;
  readonly selectionMethod: 'focus' | 'click' | 'programmatic';
}

export interface ObjectHoverChangedEvent extends BaseEvent {
  readonly type: 'object-hover-changed';
  readonly objectId: string | null;
  readonly objectName: string | null;
  readonly previousObjectId?: string | null;
  readonly cursorPosition?: { x: number; y: number };
}

/**
 * Camera Events - Handle camera state and animation coordination
 */
export interface CameraAnimationStartedEvent extends BaseEvent {
  readonly type: 'camera-animation-started';
  readonly fromPosition: THREE.Vector3;
  readonly toPosition: THREE.Vector3;
  readonly fromTarget: THREE.Vector3;
  readonly toTarget: THREE.Vector3;
  readonly duration: number;
  readonly easingFunction: string;
  readonly reason: 'object-focus' | 'view-mode-change' | 'user-control';
}

export interface CameraAnimationCompletedEvent extends BaseEvent {
  readonly type: 'camera-animation-completed';
  readonly finalPosition: THREE.Vector3;
  readonly finalTarget: THREE.Vector3;
  readonly actualDuration: number;
  readonly reason: 'object-focus' | 'view-mode-change' | 'user-control';
}

export interface CameraStateChangedEvent extends BaseEvent {
  readonly type: 'camera-state-changed';
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly zoom: number;
  readonly distance: number;
  readonly isAnimating: boolean;
}

/**
 * Time Control Events - Handle pause/unpause coordination
 */
export interface TimeControlChangeRequestedEvent extends BaseEvent {
  readonly type: 'time-control-change-requested';
  readonly action: 'pause' | 'unpause' | 'set-multiplier';
  readonly multiplier?: number;
  readonly reason: 'user-action' | 'animation' | 'object-selection' | 'system';
  readonly temporary?: boolean; // For automatic pause during animations
}

export interface TimeControlChangedEvent extends BaseEvent {
  readonly type: 'time-control-changed';
  readonly isPaused: boolean;
  readonly multiplier: number;
  readonly previousIsPaused: boolean;
  readonly previousMultiplier: number;
  readonly reason: 'user-action' | 'animation' | 'object-selection' | 'system';
}

/**
 * Calculation Events - Handle orbital calculation lifecycle
 */
export interface CalculationRequestedEvent extends BaseEvent {
  readonly type: 'calculation-requested';
  readonly viewMode: ViewType;
  readonly objectCount: number;
  readonly reason: 'view-mode-change' | 'object-update' | 'manual-refresh';
  readonly priority: 'high' | 'normal' | 'low';
}

export interface CalculationStartedEvent extends BaseEvent {
  readonly type: 'calculation-started';
  readonly viewMode: ViewType;
  readonly objectCount: number;
  readonly cacheHit: boolean;
  readonly calculationId: string;
}

export interface CalculationCompletedEvent extends BaseEvent {
  readonly type: 'calculation-completed';
  readonly viewMode: ViewType;
  readonly objectCount: number;
  readonly calculationId: string;
  readonly duration: number;
  readonly cacheHit: boolean;
  readonly collisionCount: number;
  readonly warnings: string[];
}

export interface CalculationFailedEvent extends BaseEvent {
  readonly type: 'calculation-failed';
  readonly viewMode: ViewType;
  readonly calculationId: string;
  readonly error: string;
  readonly fallbackUsed: boolean;
}

/**
 * System Events - Handle system-wide coordination
 */
export interface SystemInitializedEvent extends BaseEvent {
  readonly type: 'system-initialized';
  readonly viewMode: ViewType;
  readonly objectCount: number;
  readonly servicesRegistered: string[];
}

export interface SystemErrorEvent extends BaseEvent {
  readonly type: 'system-error';
  readonly error: string;
  readonly component: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly recoverable: boolean;
}

export interface CacheInvalidatedEvent extends BaseEvent {
  readonly type: 'cache-invalidated';
  readonly scope: 'all' | 'view-mode' | 'object';
  readonly viewMode?: ViewType;
  readonly objectId?: string;
  readonly reason: string;
}

/**
 * Performance Events - Handle performance monitoring
 */
export interface PerformanceThresholdExceededEvent extends BaseEvent {
  readonly type: 'performance-threshold-exceeded';
  readonly metric: 'calculation-time' | 'render-time' | 'memory-usage';
  readonly value: number;
  readonly threshold: number;
  readonly component: string;
}

/**
 * Union type of all events for type safety
 */
export type SystemEvent = 
  | ViewModeChangeRequestedEvent
  | ViewModeChangeStartedEvent
  | ViewModeChangeCompletedEvent
  | ViewModeChangeFailedEvent
  | ObjectFocusRequestedEvent
  | ObjectFocusStartedEvent
  | ObjectFocusCompletedEvent
  | ObjectSelectionChangedEvent
  | ObjectHoverChangedEvent
  | CameraAnimationStartedEvent
  | CameraAnimationCompletedEvent
  | CameraStateChangedEvent
  | TimeControlChangeRequestedEvent
  | TimeControlChangedEvent
  | CalculationRequestedEvent
  | CalculationStartedEvent
  | CalculationCompletedEvent
  | CalculationFailedEvent
  | SystemInitializedEvent
  | SystemErrorEvent
  | CacheInvalidatedEvent
  | PerformanceThresholdExceededEvent;

/**
 * Event listener type
 */
export type EventListener<T extends SystemEvent = SystemEvent> = (event: T) => void | Promise<void>;

/**
 * Event filter for type-safe event subscriptions
 */
export type EventFilter<T extends SystemEvent = SystemEvent> = (event: SystemEvent) => event is T;

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  readonly once?: boolean; // Unsubscribe after first event
  readonly priority?: number; // Higher numbers get called first
  readonly async?: boolean; // Whether to handle async listeners
}

/**
 * Event bus interface
 */
export interface IEventBus {
  emit<T extends SystemEvent>(event: T): Promise<void>;
  subscribe<T extends SystemEvent>(
    filter: EventFilter<T> | string,
    listener: EventListener<T>,
    options?: SubscriptionOptions
  ): () => void; // Returns unsubscribe function
  
  subscribeToType<T extends SystemEvent>(
    eventType: T['type'],
    listener: EventListener<T>,
    options?: SubscriptionOptions
  ): () => void;
  
  unsubscribe(listener: EventListener): void;
  clear(): void;
  getStatistics(): EventBusStatistics;
}

export interface EventBusStatistics {
  readonly totalEvents: number;
  readonly totalListeners: number;
  readonly eventsByType: Record<string, number>;
  readonly averageEventProcessingTime: number;
  readonly errorCount: number;
}

/**
 * Event creation helpers for type safety
 */
export const createEvent = <T extends SystemEvent>(
  type: T['type'],
  data: Omit<T, 'type' | 'timestamp' | 'source'>,
  source: string,
  correlationId?: string
): T => ({
  type,
  timestamp: Date.now(),
  source,
  correlationId,
  ...data
} as T);

/**
 * Event type guards for type-safe filtering
 */
export const isViewModeEvent = (event: SystemEvent): event is 
  ViewModeChangeRequestedEvent | ViewModeChangeStartedEvent | ViewModeChangeCompletedEvent | ViewModeChangeFailedEvent =>
  event.type.startsWith('view-mode-');

export const isObjectEvent = (event: SystemEvent): event is 
  ObjectFocusRequestedEvent | ObjectFocusStartedEvent | ObjectFocusCompletedEvent | ObjectSelectionChangedEvent | ObjectHoverChangedEvent =>
  event.type.startsWith('object-');

export const isCameraEvent = (event: SystemEvent): event is 
  CameraAnimationStartedEvent | CameraAnimationCompletedEvent | CameraStateChangedEvent =>
  event.type.startsWith('camera-');

export const isTimeControlEvent = (event: SystemEvent): event is 
  TimeControlChangeRequestedEvent | TimeControlChangedEvent =>
  event.type.startsWith('time-control-');

export const isCalculationEvent = (event: SystemEvent): event is 
  CalculationRequestedEvent | CalculationStartedEvent | CalculationCompletedEvent | CalculationFailedEvent =>
  event.type.startsWith('calculation-');

export const isSystemEvent = (event: SystemEvent): event is 
  SystemInitializedEvent | SystemErrorEvent | CacheInvalidatedEvent =>
  event.type.startsWith('system-') || event.type.startsWith('cache-');