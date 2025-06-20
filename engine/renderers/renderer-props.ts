/**
 * Standard Renderer Props Interface
 * =================================
 * 
 * Defines the standardized interface that all renderers must implement
 * as part of the new architectural rendering pipeline.
 * 
 * All renderers should follow this pattern:
 * ViewModeStrategy → VisualSizeCalculator → ObjectFactory → Renderer
 */

import type { CatalogObject } from '@/engine/system-loader';
import type * as THREE from 'three';

/**
 * Base interface that all renderers must implement
 */
export interface RendererProps {
  readonly catalogData: CatalogObject;
  readonly position?: [number, number, number];
  readonly scale?: number;
  readonly onFocus?: (object: THREE.Object3D, name: string) => void;
}

/**
 * Extended interface for renderers that need additional interaction callbacks
 */
export interface InteractiveRendererProps extends RendererProps {
  readonly onHover?: (objectId: string | null) => void;
  readonly onSelect?: (objectId: string, object: THREE.Object3D, name: string) => void;
}

/**
 * Extended interface for renderers that support shader effects
 */
export interface ShaderRendererProps extends RendererProps {
  readonly shaderScale?: number;
  readonly effectIntensity?: number;
}

/**
 * Extended interface for renderers in system contexts
 */
export interface SystemRendererProps extends InteractiveRendererProps {
  readonly starPosition?: [number, number, number];
  readonly timeMultiplier?: number;
  readonly isPaused?: boolean;
  readonly showLabel?: boolean;
}

/**
 * Type guard to check if props implement RendererProps interface
 */
export function isRendererProps(props: any): props is RendererProps {
  return (
    props &&
    typeof props === 'object' &&
    props.catalogData &&
    typeof props.catalogData === 'object'
  );
}

/**
 * Utility function to extract standard renderer props from any props object
 */
export function extractStandardProps(props: any): RendererProps {
  if (!isRendererProps(props)) {
    throw new Error('Props object does not implement RendererProps interface');
  }
  
  return {
    catalogData: props.catalogData,
    position: props.position,
    scale: props.scale,
    onFocus: props.onFocus
  };
}