import { useEffect, useMemo } from 'react'
import type { CatalogObject } from '@/engine/system-loader'

interface ObjectControlsProps {
  catalogObject: CatalogObject
  shaderScale: number
  objectScale: number
  shaderParams: Record<string, number>
  onShaderScaleChange: (scale: number) => void
  onObjectScaleChange: (scale: number) => void
  onShaderParamsChange: (params: Record<string, number>) => void
}

interface ShaderParameter {
  id: string
  name: string
  description: string
  min: number
  max: number
  step: number
  default: number
}

export function ObjectControls({
  catalogObject,
  shaderScale,
  objectScale,
  shaderParams,
  onShaderScaleChange,
  onObjectScaleChange,
  onShaderParamsChange
}: ObjectControlsProps) {
  // Define shader parameters based on object type
  const parameters = useMemo<ShaderParameter[]>(() => {
    const baseParams = [
      {
        id: 'scale',
        name: 'Object Scale',
        description: 'Overall size of the object',
        min: 0.1,
        max: 10,
        step: 0.1,
        default: catalogObject.physical?.radius || 1
      },
      {
        id: 'shaderScale',
        name: 'Shader Scale',
        description: 'Scale of shader effects',
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 1
      }
    ]

    // Add object-specific parameters based on type
    switch (catalogObject.engine_object) {
      case 'terrestrial-planet':
        return [
          ...baseParams,
          {
            id: 'hydrosphere',
            name: 'Ocean Coverage',
            description: 'Percentage of surface covered by water',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.hydrosphere || 0
          },
          {
            id: 'atmosphericPressure',
            name: 'Atmospheric Pressure',
            description: 'Relative atmospheric pressure (Earth = 1)',
            min: 0,
            max: 100,
            step: 0.1,
            default: catalogObject.physical?.atmospheric_pressure || 1
          },
          {
            id: 'albedo',
            name: 'Surface Reflectivity',
            description: 'How much light is reflected by the surface',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.albedo || 0.3
          },
          {
            id: 'vulcanism',
            name: 'Volcanic Activity',
            description: 'Level of volcanic activity',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.vulcanism || 0
          },
          {
            id: 'tectonics',
            name: 'Tectonic Activity',
            description: 'Level of tectonic plate movement',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.tectonics || 0
          }
        ]
      
      case 'gas-giant':
        return [
          ...baseParams,
          {
            id: 'bands',
            name: 'Atmospheric Bands',
            description: 'Number of visible atmospheric bands',
            min: 2,
            max: 20,
            step: 1,
            default: catalogObject.features?.bands || 10
          },
          {
            id: 'winds',
            name: 'Wind Speed',
            description: 'Speed of atmospheric winds (km/s)',
            min: 0,
            max: 1000,
            step: 10,
            default: catalogObject.features?.winds || 400
          },
          {
            id: 'magneticField',
            name: 'Magnetic Field',
            description: 'Strength of magnetic field (Earth = 1)',
            min: 0,
            max: 20,
            step: 0.1,
            default: catalogObject.features?.magnetic_field || 1
          },
          {
            id: 'ringSystem',
            name: 'Ring System',
            description: 'Prominence of planetary rings',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.ring_system || 0
          }
        ]
      
      case 'main-sequence-star':
      case 'red-dwarf-star':
      case 'variable-star':
        return [
          ...baseParams,
          {
            id: 'temperature',
            name: 'Surface Temperature',
            description: 'Star surface temperature (K)',
            min: 2000,
            max: 10000,
            step: 100,
            default: catalogObject.physical?.temperature || 5778
          },
          {
            id: 'luminosity',
            name: 'Luminosity',
            description: 'Star brightness (Sun = 1)',
            min: 0.001,
            max: 2,
            step: 0.001,
            default: catalogObject.physical?.luminosity || 1
          },
          {
            id: 'flareActivity',
            name: 'Flare Activity',
            description: 'Frequency and intensity of stellar flares',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.flare_activity || 0
          },
          {
            id: 'stellarWind',
            name: 'Stellar Wind',
            description: 'Intensity of stellar wind',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.stellar_wind || 0
          }
        ]

      case 'black-hole':
        return [
          ...baseParams,
          {
            id: 'mass',
            name: 'Mass',
            description: 'Black hole mass (Solar masses)',
            min: 3,
            max: 1000000,
            step: 1,
            default: catalogObject.physical?.mass || 1000
          },
          {
            id: 'accretionRate',
            name: 'Accretion Rate',
            description: 'Rate of matter falling into the black hole',
            min: 0,
            max: 1,
            step: 0.01,
            default: catalogObject.features?.accretion_rate || 0.5
          }
        ]

      case 'raymarched_black_hole':
        return [
          ...baseParams,
          {
            id: 'diskSpeed',
            name: 'Disk Rotation Speed',
            description: 'Speed of accretion disk rotation',
            min: 0.1,
            max: 5.0,
            step: 0.1,
            default: 1.0
          },
          {
            id: 'lensingStrength',
            name: 'Gravitational Lensing',
            description: 'Strength of gravitational lensing effect',
            min: 0.1,
            max: 3.0,
            step: 0.1,
            default: 1.0
          },
          {
            id: 'diskBrightness',
            name: 'Disk Brightness',
            description: 'Brightness of the accretion disk',
            min: 0.1,
            max: 2.0,
            step: 0.1,
            default: 1.0
          }
        ]
      
      default:
        return baseParams
    }
  }, [catalogObject])

  // Initialize shader parameters when object changes
  useEffect(() => {
    const initialParams: Record<string, number> = {}
    parameters.forEach(param => {
      if (param.id !== 'scale' && param.id !== 'shaderScale') {
        initialParams[param.id] = param.default
      }
    })
    onShaderParamsChange(initialParams)
  }, [catalogObject])

  const handleParamChange = (id: string, value: number) => {
    if (id === 'scale') {
      onObjectScaleChange(value)
    } else if (id === 'shaderScale') {
      onShaderScaleChange(value)
    } else {
      onShaderParamsChange({ ...shaderParams, [id]: value })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Object Controls</h2>
      
      <div className="space-y-4">
        {parameters.map(param => (
          <div key={param.id} className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium text-gray-300">
                {param.name}
              </label>
              <span className="text-sm text-gray-400">
                {param.id === 'scale' ? objectScale :
                 param.id === 'shaderScale' ? shaderScale :
                 shaderParams[param.id]?.toFixed(2) || param.default.toFixed(2)}
              </span>
            </div>
            
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={
                param.id === 'scale' ? objectScale :
                param.id === 'shaderScale' ? shaderScale :
                shaderParams[param.id] || param.default
              }
              onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
              className="w-full"
            />
            
            <p className="text-sm text-gray-400">
              {param.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 