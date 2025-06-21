/**
 * Rendering Configuration System
 * ==============================
 * 
 * Centralizes all magic numbers and configuration values used throughout the rendering pipeline.
 * This replaces hardcoded values scattered throughout the codebase with typed, well-documented
 * configuration objects that can be easily modified and tested.
 * 
 * Key Benefits:
 * - Eliminates magic numbers
 * - Provides single source of truth for all configuration values
 * - Enables easy testing and validation
 * - Allows runtime configuration changes
 * - Improves maintainability and readability
 */

export interface RenderingConfiguration {
  readonly camera: CameraConfiguration;
  readonly orbital: OrbitalConfiguration;
  readonly visual: VisualConfiguration;
  readonly performance: PerformanceConfiguration;
  readonly animation: AnimationConfiguration;
}

export interface CameraConfiguration {
  readonly distanceMultipliers: {
    readonly consistent: number;           // 4.0 - Same visual size = same camera distance
    readonly minimum: number;             // 2.5 - Minimum distance multiplier  
    readonly maximum: number;             // 15.0 - Maximum distance multiplier
    readonly profileFallback: number;     // 15.0 - Fixed distance for single objects in profile
    readonly profileLayout: number;       // 1.2 - Layout span multiplier for profile multi-object
    readonly profileTarget: number;       // 1.5 - Target distance multiplier for profile single object
  };
  
  readonly elevationAngles: {
    readonly explorational: number;       // 30° - Default elevation for explorational mode
    readonly navigational: number;        // 35° - Default elevation for navigational mode
    readonly profile: number;             // 22.5° - Default elevation for profile mode
    readonly scientific: number;          // 15° - Default elevation for scientific mode
    readonly birdsEyeOffset: number;      // 10° - Additional elevation for birds eye view
  };
  
  readonly animationDuration: {
    readonly quick: number;               // 600ms - Quick transitions
    readonly standard: number;            // 800ms - Standard focus animations
    readonly extended: number;            // 1200ms - Extended birds eye animations
    readonly slow: number;                // 2000ms - Slow deliberate animations
  };
  
  readonly detectionThresholds: {
    readonly fakeOffsetMax: number;       // 20 - Max distance to detect fake offset
    readonly singleObjectDistance: number; // 15 - Fixed distance for single objects
    readonly minHorizontalDirection: number; // 0.1 - Minimum horizontal direction length
    readonly fakeOffsetMultiplier: number; // 3 - Multiplier for fake offset based on visual size
  };
  
  readonly absoluteLimits: {
    readonly minDistance: number;         // 0.1 - Absolute minimum camera distance
    readonly maxDistance: number;         // 10000 - Absolute maximum camera distance
    readonly nearPlane: number;           // 0.01 - Near clipping plane
    readonly farPlane: number;            // 50000 - Far clipping plane
    readonly safetyMargin: number;        // 2.0 - Safety margin multiplier (never closer than 2x radius)
  };
}

export interface OrbitalConfiguration {
  readonly baseScaling: {
    readonly explorational: number;       // 50.0 - Base orbit scaling for explorational mode
    readonly navigational: number;        // 40.0 - Base orbit scaling for navigational mode
    readonly profile: number;             // 0.05 - Base orbit scaling for profile mode (highly compressed for diagrams)
    readonly scientific: number;          // 1.0 - Base orbit scaling for scientific mode (uses real data)
    readonly default: number;             // 50.0 - Default orbit scaling fallback
  };

  readonly safetyFactors: {
    readonly minimum: number;             // 2.0 - Minimum safety factor for all modes
    readonly explorational: number;       // 2.5 - Safety factor for explorational mode
    readonly navigational: number;        // 3.0 - Safety factor for navigational mode
    readonly profile: number;             // 1.05 - Safety factor for profile mode (minimal for very tight diagrams)
    readonly scientific: number;          // 1.1 - Safety factor for scientific mode (minimal for accuracy)
    readonly moonMinimum: number;         // 2.0 - Minimum safety factor specifically for moon spacing
  };
  
  readonly beltWidthLimits: {
    readonly explorationMultiplier: number; // 2.0 - Belt width multiplier for explorational mode
    readonly defaultMultiplier: number;     // 0.5 - Default belt width multiplier
    readonly profileMultiplier: number;     // 0.5 - Profile mode belt width multiplier
  };
  
  readonly collisionDetection: {
    readonly maxIterations: number;       // 10 - Maximum collision detection iterations
    readonly adjustmentFactor: number;    // 1.1 - Factor for adjusting colliding orbits
    readonly convergenceThreshold: number; // 0.001 - Threshold for collision resolution convergence
  };
  
  readonly fallbackValues: {
    readonly maxOrbitRadius: number;      // 200 - Fallback max orbital radius for extreme systems
    readonly defaultObjectRadius: number; // 1 - Default object radius when not specified
    readonly defaultOrbitDistance: number; // 10 - Default orbit distance when not specified
  };
  
  readonly beltConfiguration: {
    readonly defaultBeltWidth: number;    // 0.2 - Default width multiplier for asteroid belts
  };
  
  readonly equidistantSpacing: {
    readonly baseSpacing: number;         // 0.5 - Base spacing for equidistant orbital layout (tighter profile diagrams)
    readonly spacingMultiplier: number;   // 1.0 - Multiplier for spacing between orbits (linear for profiles)
  };
}

export interface VisualConfiguration {
  readonly sizeConstraints: {
    readonly minVisualSize: number;       // 0.03 - Minimum visual size for any object
    readonly maxVisualSize: number;       // 40.0 - Maximum visual size for scientific mode
    readonly earthReferenceRadius: number; // 6371000 - Earth radius in meters for scaling reference
  };
  
  readonly scalingFactors: {
    readonly logarithmicBase: number;     // 2.0 - Base for logarithmic scaling calculations
    readonly proportionalityConstant: number; // 1.0 - Base proportionality constant
    readonly hierarchyAdjustment: number; // 0.9 - Adjustment factor for hierarchy enforcement
  };

  readonly starEffects: {
    readonly brightness: number;          // 30.0 - Default star brightness factor
    readonly hue: number;                 // 0.08 - Default star hue
    readonly nebulaHue: number;           // 0.66 - Default nebula hue
    readonly rotationSpeed: number;       // 1.0 - Default rotation speed
  };
  
  readonly fixedSizes: {
    readonly star: number;                // 2.0 - Fixed star size in navigational/profile modes
    readonly planet: number;              // 1.2 - Fixed planet size in navigational/profile modes
    readonly moon: number;                // 0.6 - Fixed moon size in navigational/profile modes
    readonly asteroid: number;            // 0.3 - Fixed asteroid size in navigational/profile modes
    readonly belt: number;                // 1.0 - Fixed belt size in navigational/profile modes
    readonly barycenter: number;          // 0.0 - Barycenter is invisible
  };
  
  readonly hierarchyConstraints: {
    readonly maxChildToParentRatio: number; // 0.8 - Maximum size ratio of child to parent
    readonly minChildToParentRatio: number; // 0.1 - Minimum size ratio of child to parent
    readonly enforceHierarchy: boolean;     // true - Whether to enforce size hierarchy
  };
}

export interface PerformanceConfiguration {
  readonly caching: {
    readonly enableMemoization: boolean;  // true - Enable calculation result caching
    readonly maxCacheSize: number;        // 1000 - Maximum number of cached results
    readonly cacheTimeout: number;        // 300000 - Cache timeout in milliseconds (5 minutes)
  };
  
  readonly rendering: {
    readonly enableFrustumCulling: boolean; // true - Enable frustum culling for performance
    readonly maxRenderDistance: number;   // 50000 - Maximum render distance
    readonly lodSwitchDistance: number;   // 1000 - Distance to switch to lower LOD
  };
  
  readonly calculations: {
    readonly precisionDigits: number;     // 6 - Number of decimal places for calculations
    readonly enableOptimizations: boolean; // true - Enable calculation optimizations
  };
}

export interface AnimationConfiguration {
  readonly easingFunctions: {
    readonly leap: string;                // 'easeOutQuart' - Leap easing function
    readonly smooth: string;              // 'easeInOutCubic' - Smooth easing function
    readonly quick: string;               // 'easeOutQuad' - Quick easing function
    readonly bounce: string;              // 'easeOutBounce' - Bounce easing function
  };
  
  readonly transitionSettings: {
    readonly enableTransitions: boolean;  // true - Enable smooth transitions
    readonly respectPausedState: boolean; // true - Respect paused simulation state
    readonly debounceTime: number;        // 100 - Debounce time for rapid changes (ms)
  };
}

/**
 * Default rendering configuration values
 * These represent the current hardcoded values extracted from the codebase
 */
export const DEFAULT_RENDERING_CONFIGURATION: RenderingConfiguration = {
  camera: {
    distanceMultipliers: {
      consistent: 4.0,
      minimum: 2.5,
      maximum: 15.0,
      profileFallback: 15.0,
      profileLayout: 1.2,
      profileTarget: 1.5,
    },
    elevationAngles: {
      explorational: 30,
      navigational: 35,
      profile: 22.5,
      scientific: 15,
      birdsEyeOffset: 10,
    },
    animationDuration: {
      quick: 600,
      standard: 800,
      extended: 1200,
      slow: 2000,
    },
    detectionThresholds: {
      fakeOffsetMax: 20,
      singleObjectDistance: 15,
      minHorizontalDirection: 0.1,
      fakeOffsetMultiplier: 3,
    },
    absoluteLimits: {
      minDistance: 0.1,
      maxDistance: 10000,
      nearPlane: 0.01,
      farPlane: 50000,
      safetyMargin: 2.0,
    },
  },
  
  orbital: {
    baseScaling: {
      explorational: 50.0,
      navigational: 40.0,
      profile: 0.05,        // FIXED: Much more compressed for profile diagrams (was 0.3)
      scientific: 1.0,
      default: 50.0,
    },
    safetyFactors: {
      minimum: 2.0,
      explorational: 2.5,
      navigational: 3.0,
      profile: 1.05,        // FIXED: Even smaller safety factor for tighter profile diagrams (was 1.2)
      scientific: 1.1,
      moonMinimum: 2.0,
    },
    beltWidthLimits: {
      explorationMultiplier: 2.0,
      defaultMultiplier: 0.5,
      profileMultiplier: 0.5,
    },
    collisionDetection: {
      maxIterations: 10,
      adjustmentFactor: 1.1,
      convergenceThreshold: 0.001,
    },
    fallbackValues: {
      maxOrbitRadius: 200,
      defaultObjectRadius: 1,
      defaultOrbitDistance: 10,
    },
    beltConfiguration: {
      defaultBeltWidth: 0.2,
    },
    equidistantSpacing: {
      baseSpacing: 0.5,     // FIXED: Even smaller base spacing for tighter profile diagrams (was 0.8)
      spacingMultiplier: 1.0, // FIXED: Linear spacing for clean profile layout (was 1.5)
    },
  },
  
  visual: {
    sizeConstraints: {
      minVisualSize: 0.03,
      maxVisualSize: 40.0,
      earthReferenceRadius: 6371000,
    },
    scalingFactors: {
      logarithmicBase: 2.0,
      proportionalityConstant: 1.0,
      hierarchyAdjustment: 0.9,
    },
    starEffects: {
      brightness: 30.0,
      hue: 0.08,
      nebulaHue: 0.66,
      rotationSpeed: 1.0,
    },
    fixedSizes: {
      star: 2.0,
      planet: 1.2,
      moon: 0.6,
      asteroid: 0.3,
      belt: 1.0,
      barycenter: 0.0,
    },
    hierarchyConstraints: {
      maxChildToParentRatio: 0.8,
      minChildToParentRatio: 0.1,
      enforceHierarchy: true,
    },
  },
  
  performance: {
    caching: {
      enableMemoization: true,
      maxCacheSize: 1000,
      cacheTimeout: 300000,
    },
    rendering: {
      enableFrustumCulling: true,
      maxRenderDistance: 50000,
      lodSwitchDistance: 1000,
    },
    calculations: {
      precisionDigits: 6,
      enableOptimizations: true,
    },
  },
  
  animation: {
    easingFunctions: {
      leap: 'easeOutQuart',
      smooth: 'easeInOutCubic',
      quick: 'easeOutQuad',
      bounce: 'easeOutBounce',
    },
    transitionSettings: {
      enableTransitions: true,
      respectPausedState: true,
      debounceTime: 100,
    },
  },
};

/**
 * Configuration validation functions
 */
export function validateRenderingConfiguration(config: RenderingConfiguration): string[] {
  const errors: string[] = [];
  
  // Validate camera configuration
  if (config.camera.distanceMultipliers.minimum >= config.camera.distanceMultipliers.maximum) {
    errors.push('Camera minimum distance multiplier must be less than maximum');
  }
  
  if (config.camera.elevationAngles.explorational < 0 || config.camera.elevationAngles.explorational > 90) {
    errors.push('Camera elevation angles must be between 0 and 90 degrees');
  }
  
  // Validate orbital configuration
  if (config.orbital.safetyFactors.minimum < 1.0) {
    errors.push('Orbital safety factors must be at least 1.0');
  }
  
  if (config.orbital.collisionDetection.maxIterations < 1) {
    errors.push('Collision detection max iterations must be at least 1');
  }
  
  // Validate visual configuration
  if (config.visual.sizeConstraints.minVisualSize >= config.visual.sizeConstraints.maxVisualSize) {
    errors.push('Visual size minimum must be less than maximum');
  }
  
  // Validate performance configuration
  if (config.performance.caching.maxCacheSize < 1) {
    errors.push('Performance cache size must be at least 1');
  }
  
  return errors;
}

/**
 * Configuration service for managing rendering configuration
 */
export class ConfigurationService {
  private static instance: ConfigurationService;
  private configuration: RenderingConfiguration;
  
  private constructor(config: RenderingConfiguration = DEFAULT_RENDERING_CONFIGURATION) {
    const errors = validateRenderingConfiguration(config);
    if (errors.length > 0) {
      throw new Error(`Invalid rendering configuration: ${errors.join(', ')}`);
    }
    this.configuration = config;
  }
  
  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }
  
  public getConfiguration(): RenderingConfiguration {
    // Return a deep copy to ensure immutability
    return structuredClone(this.configuration);
  }
  
  public updateConfiguration(newConfig: Partial<RenderingConfiguration>): void {
    const updatedConfig = {
      ...this.configuration,
      ...newConfig,
    };
    
    const errors = validateRenderingConfiguration(updatedConfig);
    if (errors.length > 0) {
      throw new Error(`Invalid rendering configuration update: ${errors.join(', ')}`);
    }
    
    this.configuration = updatedConfig;
  }
  
  public resetToDefault(): void {
    this.configuration = DEFAULT_RENDERING_CONFIGURATION;
  }
}