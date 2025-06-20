/**
 * React Integration for Event-Driven Architecture
 * ===============================================
 * 
 * React hooks and utilities that integrate the event system with existing React patterns.
 * Designed to enhance current functionality without breaking existing components.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  SystemEvent,
  EventListener,
  EventFilter,
  SubscriptionOptions,
  IEventBus
} from './event-types';
import { globalEventBus } from './event-bus';

/**
 * Hook for subscribing to events in React components
 */
export function useEventSubscription<T extends SystemEvent>(
  eventTypeOrFilter: T['type'] | EventFilter<T>,
  listener: EventListener<T>,
  dependencies: any[] = [],
  options?: SubscriptionOptions,
  eventBus: IEventBus = globalEventBus
): void {
  const listenerRef = useRef(listener);
  const optionsRef = useRef(options);

  // Update refs when dependencies change
  useEffect(() => {
    listenerRef.current = listener;
    optionsRef.current = options;
  }, dependencies);

  useEffect(() => {
    // Create stable listener that uses current ref
    const stableListener: EventListener<T> = (event) => {
      return listenerRef.current(event);
    };

    // Subscribe based on type
    const unsubscribe = typeof eventTypeOrFilter === 'string'
      ? eventBus.subscribeToType(eventTypeOrFilter, stableListener, optionsRef.current)
      : eventBus.subscribe(eventTypeOrFilter, stableListener, optionsRef.current);

    return unsubscribe;
  }, [eventTypeOrFilter, eventBus]);
}

/**
 * Hook for emitting events from React components
 */
export function useEventEmitter(
  eventBus: IEventBus = globalEventBus
): <T extends SystemEvent>(event: T) => Promise<void> {
  return useCallback(
    <T extends SystemEvent>(event: T) => eventBus.emit(event),
    [eventBus]
  );
}

/**
 * Hook that enhances existing object selection logic with events
 */
export function useObjectSelectionEvents(
  currentSelection: {
    selectedObjectId: string | null;
    hoveredObjectId: string | null;
    focusedObjectId: string | null;
  },
  callbacks: {
    onObjectFocus?: (objectId: string, objectName: string) => void;
    onObjectSelect?: (objectId: string, objectName: string) => void;
    onObjectHover?: (objectId: string | null) => void;
  },
  eventBus: IEventBus = globalEventBus
) {
  const emit = useEventEmitter(eventBus);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Listen for object selection events and call existing callbacks
  useEventSubscription(
    'object-selection-changed',
    useCallback((event) => {
      if (callbacksRef.current.onObjectSelect && event.objectId) {
        callbacksRef.current.onObjectSelect(event.objectId, event.objectName || '');
      }
    }, []),
    []
  );

  useEventSubscription(
    'object-focus-completed',
    useCallback((event) => {
      if (callbacksRef.current.onObjectFocus) {
        callbacksRef.current.onObjectFocus(event.objectId, event.objectName);
      }
    }, []),
    []
  );

  useEventSubscription(
    'object-hover-changed',
    useCallback((event) => {
      if (callbacksRef.current.onObjectHover) {
        callbacksRef.current.onObjectHover(event.objectId);
      }
    }, []),
    []
  );

  // Enhanced focus function that emits events
  const requestObjectFocus = useCallback(async (
    objectId: string,
    objectName: string,
    reason: 'user-click' | 'breadcrumb' | 'search' | 'automatic' = 'user-click',
    animationDuration?: number
  ) => {
    const event = {
      type: 'object-focus-requested' as const,
      timestamp: Date.now(),
      source: 'useObjectSelectionEvents',
      objectId,
      objectName,
      reason,
      animationDuration
    };

    await emit(event);
  }, [emit]);

  // Enhanced hover function that emits events
  const handleObjectHover = useCallback(async (
    objectId: string | null,
    objectName?: string | null,
    cursorPosition?: { x: number; y: number }
  ) => {
    const event = {
      type: 'object-hover-changed' as const,
      timestamp: Date.now(),
      source: 'useObjectSelectionEvents',
      objectId,
      objectName,
      previousObjectId: currentSelection.hoveredObjectId,
      cursorPosition
    };

    await emit(event);
  }, [emit, currentSelection.hoveredObjectId]);

  return {
    requestObjectFocus,
    handleObjectHover
  };
}

/**
 * Hook that enhances existing view mode logic with events
 */
export function useViewModeEvents(
  currentViewMode: string,
  setViewMode: (mode: string) => void,
  eventBus: IEventBus = globalEventBus
) {
  const emit = useEventEmitter(eventBus);
  const setViewModeRef = useRef(setViewMode);

  useEffect(() => {
    setViewModeRef.current = setViewMode;
  }, [setViewMode]);

  // Listen for view mode change completion and update local state
  useEventSubscription(
    'view-mode-change-completed',
    useCallback((event) => {
      setViewModeRef.current(event.toMode);
    }, []),
    []
  );

  // Enhanced view mode change function that emits events
  const requestViewModeChange = useCallback(async (
    toMode: string,
    reason: 'user-action' | 'automatic' | 'system' = 'user-action',
    skipValidation = false
  ) => {
    const event = {
      type: 'view-mode-change-requested' as const,
      timestamp: Date.now(),
      source: 'useViewModeEvents',
      fromMode: currentViewMode as any,
      toMode: toMode as any,
      reason,
      skipValidation
    };

    await emit(event);
  }, [emit, currentViewMode]);

  return {
    requestViewModeChange
  };
}

/**
 * Hook that enhances existing time control logic with events
 */
export function useTimeControlEvents(
  currentState: {
    isPaused: boolean;
    timeMultiplier: number;
  },
  callbacks: {
    setPaused: (paused: boolean) => void;
    setTimeMultiplier: (multiplier: number) => void;
  },
  eventBus: IEventBus = globalEventBus
) {
  const emit = useEventEmitter(eventBus);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Listen for time control changes and update local state
  useEventSubscription(
    'time-control-changed',
    useCallback((event) => {
      callbacksRef.current.setPaused(event.isPaused);
      callbacksRef.current.setTimeMultiplier(event.multiplier);
    }, []),
    []
  );

  // Enhanced time control functions that emit events
  const requestPause = useCallback(async (
    reason: 'user-action' | 'animation' | 'object-selection' | 'system' = 'user-action',
    temporary = false
  ) => {
    const event = {
      type: 'time-control-change-requested' as const,
      timestamp: Date.now(),
      source: 'useTimeControlEvents',
      action: 'pause' as const,
      reason,
      temporary
    };

    await emit(event);
  }, [emit]);

  const requestUnpause = useCallback(async (
    reason: 'user-action' | 'animation' | 'object-selection' | 'system' = 'user-action'
  ) => {
    const event = {
      type: 'time-control-change-requested' as const,
      timestamp: Date.now(),
      source: 'useTimeControlEvents',
      action: 'unpause' as const,
      reason
    };

    await emit(event);
  }, [emit]);

  const requestTimeMultiplierChange = useCallback(async (
    multiplier: number,
    reason: 'user-action' | 'automatic' | 'system' = 'user-action'
  ) => {
    const event = {
      type: 'time-control-change-requested' as const,
      timestamp: Date.now(),
      source: 'useTimeControlEvents',
      action: 'set-multiplier' as const,
      multiplier,
      reason
    };

    await emit(event);
  }, [emit]);

  return {
    requestPause,
    requestUnpause,
    requestTimeMultiplierChange
  };
}

/**
 * Hook for monitoring system events (useful for debugging and analytics)
 */
export function useEventMonitoring(
  eventBus: IEventBus = globalEventBus
): {
  eventCount: number;
  recentEvents: SystemEvent[];
  eventsByType: Record<string, number>;
} {
  const [eventCount, setEventCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [eventsByType, setEventsByType] = useState<Record<string, number>>({});

  useEventSubscription(
    () => true, // Listen to all events
    useCallback((event: SystemEvent) => {
      setEventCount(prev => prev + 1);
      setRecentEvents(prev => {
        const updated = [event, ...prev].slice(0, 50); // Keep last 50 events
        return updated;
      });
      setEventsByType(prev => ({
        ...prev,
        [event.type]: (prev[event.type] || 0) + 1
      }));
    }, []),
    []
  );

  return {
    eventCount,
    recentEvents,
    eventsByType
  };
}

/**
 * Hook that bridges existing camera controller with event system
 */
export function useCameraEvents(
  cameraController: any, // Would be typed based on actual camera controller
  eventBus: IEventBus = globalEventBus
) {
  const emit = useEventEmitter(eventBus);
  const controllerRef = useRef(cameraController);

  useEffect(() => {
    controllerRef.current = cameraController;
  }, [cameraController]);

  // Listen for camera animation requests
  useEventSubscription(
    'camera-animation-started',
    useCallback(async (event) => {
      const controller = controllerRef.current;
      if (!controller) return;

      // Start camera animation using existing controller
      try {
        // This would integrate with the actual camera controller API
        await controller.animateToPosition(
          event.toPosition,
          event.toTarget,
          event.duration,
          event.easingFunction
        );

        // Emit completion event
        const completedEvent = {
          type: 'camera-animation-completed' as const,
          timestamp: Date.now(),
          source: 'useCameraEvents',
          correlationId: event.correlationId,
          finalPosition: event.toPosition,
          finalTarget: event.toTarget,
          actualDuration: event.duration, // Would be actual measured duration
          reason: event.reason
        };

        await emit(completedEvent);

      } catch (error) {
        console.error('Camera animation failed:', error);
      }
    }, [emit]),
    []
  );

  // Function to emit camera state changes
  const emitCameraStateChange = useCallback(async (
    position: any,
    target: any,
    zoom: number,
    distance: number,
    isAnimating: boolean
  ) => {
    const event = {
      type: 'camera-state-changed' as const,
      timestamp: Date.now(),
      source: 'useCameraEvents',
      position,
      target,
      zoom,
      distance,
      isAnimating
    };

    await emit(event);
  }, [emit]);

  return {
    emitCameraStateChange
  };
}

/**
 * Provider component for event bus context (optional)
 */
import React, { createContext, useContext, ReactNode } from 'react';

const EventBusContext = createContext<IEventBus | null>(null);

export function EventBusProvider({ 
  children, 
  eventBus = globalEventBus 
}: { 
  children: ReactNode; 
  eventBus?: IEventBus; 
}): JSX.Element {
  return (
    React.createElement(EventBusContext.Provider, { value: eventBus }, children)
  );
}

export function useEventBus(): IEventBus {
  const eventBus = useContext(EventBusContext);
  return eventBus || globalEventBus;
}

// Add missing React imports for useState
import { useState } from 'react';