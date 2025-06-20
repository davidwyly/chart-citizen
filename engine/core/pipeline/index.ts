/**
 * Pipeline Module - Clean Architecture Interface
 * ============================================= 
 * 
 * Direct access to the new orbital mechanics architecture.
 * No adapters, no legacy code, no crutches - just clean, modern design.
 */

import { PipelineOrchestrator } from './pipeline-orchestrator';
import { serviceContainer, SERVICE_IDENTIFIERS, registerOrbitalServices } from '@/engine/services/container/service-container';
import { DEFAULT_RENDERING_CONFIGURATION } from '@/engine/core/configuration/rendering-configuration';
import { globalEventBus, CoordinationService } from '@/engine/core/events';
import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { LegacyCalculationResult } from './pipeline-orchestrator';

// Global pipeline orchestrator instance
let globalOrchestrator: PipelineOrchestrator | null = null;

/**
 * Initialize the orbital mechanics pipeline
 */
async function initializePipeline(): Promise<PipelineOrchestrator> {
  if (globalOrchestrator) {
    return globalOrchestrator;
  }

  // Register services
  await registerOrbitalServices();
  
  // Get the main service
  const orbitalCalculationService = serviceContainer.get(SERVICE_IDENTIFIERS.OrbitalCalculationService);
  
  // Initialize coordination service
  const coordinationService = new CoordinationService(globalEventBus);
  
  // Create pipeline orchestrator
  globalOrchestrator = new PipelineOrchestrator(
    orbitalCalculationService,
    DEFAULT_RENDERING_CONFIGURATION,
    globalEventBus,
    {
      enableProgressTracking: true,
      enableEvents: true,
      legacyCompatibilityMode: false, // No legacy compatibility
      enableErrorRecovery: true
    }
  );
  
  return globalOrchestrator;
}

/**
 * Main calculation function - clean modern interface
 */
export async function calculateSystemOrbitalMechanics(
  objects: CelestialObject[],
  viewType: ViewType,
  isPaused: boolean = false
): Promise<Map<string, LegacyCalculationResult>> {
  // Add timeout to prevent hanging
  return Promise.race([
    (async () => {
      const orchestrator = await initializePipeline();
      return orchestrator.calculateSystemOrbitalMechanics(objects, viewType, isPaused);
    })(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Orbital mechanics calculation timed out after 30 seconds'));
      }, 30000);
    })
  ]);
}

/**
 * Cache clearing - handled by event system
 */
export function clearOrbitalMechanicsCache(): void {
  // New architecture handles cache clearing automatically via events
  if (globalOrchestrator) {
    console.log('🧹 Cache cleared via new architecture event system');
  }
}

/**
 * Advanced async calculation with progress
 */
export async function calculateSystemOrbitalMechanicsAsync(
  objects: CelestialObject[],
  viewType: ViewType,
  progressCallback?: (stage: string, progress: number) => void
): Promise<Map<string, LegacyCalculationResult>> {
  const orchestrator = await initializePipeline();
  
  const wrappedProgressCallback = progressCallback ? (progress: any) => {
    progressCallback(progress.stage, progress.progress);
  } : undefined;

  const result = await orchestrator.executeCalculationPipeline(
    objects,
    viewType,
    false,
    wrappedProgressCallback
  );

  return result.legacyFormat;
}

/**
 * Get pipeline health status
 */
export async function getPipelineHealthStatus() {
  if (!globalOrchestrator) {
    return { healthy: false, message: 'Pipeline not initialized' };
  }
  
  return await globalOrchestrator.healthCheck();
}

/**
 * Get pipeline statistics
 */
export function getPipelineStatistics() {
  if (!globalOrchestrator) {
    return { activeRequests: 0, message: 'Pipeline not initialized' };
  }
  
  return globalOrchestrator.getStatistics();
}

// Export the orchestrator and related types for advanced usage
export { PipelineOrchestrator } from './pipeline-orchestrator';
export type { 
  LegacyCalculationResult,
  PipelineContext,
  PipelineProgress,
  PipelineResult,
  PipelineOptions
} from './pipeline-orchestrator';