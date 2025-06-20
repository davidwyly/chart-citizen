/**
 * Event Bus Implementation
 * ========================
 * 
 * High-performance, type-safe event bus for coordinating complex system interactions.
 * Designed to enhance existing patterns without breaking current functionality.
 */

import type {
  SystemEvent,
  EventListener,
  EventFilter,
  IEventBus,
  EventBusStatistics,
  SubscriptionOptions
} from './event-types';

interface Subscription<T extends SystemEvent = SystemEvent> {
  readonly id: string;
  readonly listener: EventListener<T>;
  readonly filter?: EventFilter<T> | string;
  readonly options: Required<SubscriptionOptions>;
  readonly createdAt: number;
  callCount: number;
  lastCalledAt?: number;
}

export class EventBus implements IEventBus {
  private subscriptions = new Map<string, Subscription>();
  private subscriptionsByType = new Map<string, Set<string>>();
  private eventCount = 0;
  private processingTimes: number[] = [];
  private errorCount = 0;
  private isProcessing = false;
  private eventQueue: SystemEvent[] = [];

  private static instance: EventBus | null = null;

  constructor() {
    // Bind methods to preserve context
    this.emit = this.emit.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.subscribeToType = this.subscribeToType.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  /**
   * Get singleton instance (optional - can also use regular instantiation)
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit an event to all matching subscribers
   */
  async emit<T extends SystemEvent>(event: T): Promise<void> {
    this.eventCount++;
    const startTime = performance.now();

    try {
      // Queue events if currently processing to avoid recursion
      if (this.isProcessing) {
        this.eventQueue.push(event);
        return;
      }

      this.isProcessing = true;
      await this.processEvent(event);

      // Process any queued events
      while (this.eventQueue.length > 0) {
        const queuedEvent = this.eventQueue.shift()!;
        await this.processEvent(queuedEvent);
      }

      const endTime = performance.now();
      this.recordProcessingTime(endTime - startTime);

    } catch (error) {
      this.errorCount++;
      console.error('Event bus error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Subscribe to events using a filter or event type
   */
  subscribe<T extends SystemEvent>(
    filter: EventFilter<T> | string,
    listener: EventListener<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscription: Subscription<T> = {
      id: this.generateSubscriptionId(),
      listener,
      filter,
      options: {
        once: options.once ?? false,
        priority: options.priority ?? 0,
        async: options.async ?? false
      },
      createdAt: Date.now(),
      callCount: 0
    };

    this.subscriptions.set(subscription.id, subscription as Subscription);

    // Index by event type for performance
    if (typeof filter === 'string') {
      this.indexSubscriptionByType(subscription.id, filter);
    }

    // Return unsubscribe function
    return () => {
      this.removeSubscription(subscription.id);
    };
  }

  /**
   * Subscribe to specific event type (convenience method)
   */
  subscribeToType<T extends SystemEvent>(
    eventType: T['type'],
    listener: EventListener<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    return this.subscribe(eventType, listener, options);
  }

  /**
   * Remove a specific listener
   */
  unsubscribe(listener: EventListener): void {
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.listener === listener) {
        this.removeSubscription(id);
        break;
      }
    }
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.subscriptionsByType.clear();
  }

  /**
   * Get event bus statistics
   */
  getStatistics(): EventBusStatistics {
    const eventsByType: Record<string, number> = {};
    
    // This is a simplified version - in a real implementation you'd track this
    for (const eventType of this.subscriptionsByType.keys()) {
      eventsByType[eventType] = 0; // Would track actual event counts
    }

    return {
      totalEvents: this.eventCount,
      totalListeners: this.subscriptions.size,
      eventsByType,
      averageEventProcessingTime: this.processingTimes.length > 0 
        ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
        : 0,
      errorCount: this.errorCount
    };
  }

  /**
   * Process a single event
   */
  private async processEvent<T extends SystemEvent>(event: T): Promise<void> {
    const matchingSubscriptions = this.findMatchingSubscriptions(event);
    
    // Sort by priority (higher priority first)
    matchingSubscriptions.sort((a, b) => b.options.priority - a.options.priority);

    // Process synchronous listeners first
    const syncListeners = matchingSubscriptions.filter(s => !s.options.async);
    const asyncListeners = matchingSubscriptions.filter(s => s.options.async);

    // Process sync listeners in priority order
    for (const subscription of syncListeners) {
      await this.callListener(subscription, event);
    }

    // Process async listeners concurrently
    if (asyncListeners.length > 0) {
      await Promise.all(
        asyncListeners.map(subscription => this.callListener(subscription, event))
      );
    }
  }

  /**
   * Find subscriptions that match the event
   */
  private findMatchingSubscriptions<T extends SystemEvent>(event: T): Subscription<T>[] {
    const matching: Subscription<T>[] = [];

    // Check type-indexed subscriptions first (performance optimization)
    const typeSubscriptions = this.subscriptionsByType.get(event.type);
    if (typeSubscriptions) {
      for (const subscriptionId of typeSubscriptions) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          matching.push(subscription as Subscription<T>);
        }
      }
    }

    // Check filter-based subscriptions
    for (const subscription of this.subscriptions.values()) {
      if (subscription.filter && typeof subscription.filter === 'function') {
        try {
          if (subscription.filter(event)) {
            matching.push(subscription as Subscription<T>);
          }
        } catch (error) {
          console.warn('Event filter error:', error);
        }
      }
    }

    return matching;
  }

  /**
   * Call a listener with error handling
   */
  private async callListener<T extends SystemEvent>(
    subscription: Subscription<T>,
    event: T
  ): Promise<void> {
    try {
      subscription.callCount++;
      subscription.lastCalledAt = Date.now();

      const result = subscription.listener(event);
      
      // Handle async listeners
      if (result instanceof Promise) {
        await result;
      }

      // Remove one-time listeners
      if (subscription.options.once) {
        this.removeSubscription(subscription.id);
      }

    } catch (error) {
      this.errorCount++;
      console.error('Event listener error:', error, 'Event:', event);
    }
  }

  /**
   * Remove a subscription
   */
  private removeSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    this.subscriptions.delete(subscriptionId);

    // Remove from type index
    if (typeof subscription.filter === 'string') {
      const typeSubscriptions = this.subscriptionsByType.get(subscription.filter);
      if (typeSubscriptions) {
        typeSubscriptions.delete(subscriptionId);
        if (typeSubscriptions.size === 0) {
          this.subscriptionsByType.delete(subscription.filter);
        }
      }
    }
  }

  /**
   * Index subscription by event type for performance
   */
  private indexSubscriptionByType(subscriptionId: string, eventType: string): void {
    if (!this.subscriptionsByType.has(eventType)) {
      this.subscriptionsByType.set(eventType, new Set());
    }
    this.subscriptionsByType.get(eventType)!.add(subscriptionId);
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record processing time for statistics
   */
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    
    // Keep only last 100 measurements for rolling average
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
  }

  /**
   * Get subscription details for debugging
   */
  getSubscriptionDetails(): Array<{
    id: string;
    filter: string | 'function';
    priority: number;
    callCount: number;
    createdAt: number;
    lastCalledAt?: number;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      filter: typeof sub.filter === 'string' ? sub.filter : 'function',
      priority: sub.options.priority,
      callCount: sub.callCount,
      createdAt: sub.createdAt,
      lastCalledAt: sub.lastCalledAt
    }));
  }

  /**
   * Health check for the event bus
   */
  healthCheck(): {
    healthy: boolean;
    issues: string[];
    stats: EventBusStatistics;
  } {
    const issues: string[] = [];
    const stats = this.getStatistics();

    // Check for potential memory leaks
    if (this.subscriptions.size > 1000) {
      issues.push(`High subscription count: ${this.subscriptions.size}`);
    }

    // Check for performance issues
    if (stats.averageEventProcessingTime > 50) {
      issues.push(`High average processing time: ${stats.averageEventProcessingTime}ms`);
    }

    // Check error rate
    const errorRate = this.eventCount > 0 ? (this.errorCount / this.eventCount) : 0;
    if (errorRate > 0.05) { // 5% error rate
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats
    };
  }
}

/**
 * Global event bus instance
 */
export const globalEventBus = new EventBus();

/**
 * Helper functions for common event patterns
 */
export const emitEvent = globalEventBus.emit;
export const subscribeToEvent = globalEventBus.subscribe;
export const subscribeToEventType = globalEventBus.subscribeToType;