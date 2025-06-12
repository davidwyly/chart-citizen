import type { CatalogObject } from '@/engine/system-loader'

interface ObjectInfoProps {
  catalogObject: CatalogObject
}

interface InfoSection {
  title: string
  items: Array<{
    label: string
    value: string | number
    unit?: string
  }>
}

export function ObjectInfo({ catalogObject }: ObjectInfoProps) {
  // Organize object information into sections
  const sections: InfoSection[] = [
    {
      title: 'Physical Properties',
      items: [
        {
          label: 'Mass',
          value: catalogObject.physical?.mass || 0,
          unit: 'kg'
        },
        {
          label: 'Radius',
          value: catalogObject.physical?.radius || 0,
          unit: 'km'
        },
        {
          label: 'Surface Temperature',
          value: catalogObject.physical?.surface_temperature || 0,
          unit: 'K'
        },
        {
          label: 'Density',
          value: catalogObject.physical?.density || 0,
          unit: 'g/cm³'
        }
      ]
    },
    {
      title: 'Orbital Properties',
      items: [
        {
          label: 'Semi-major Axis',
          value: catalogObject.orbit?.semi_major_axis || 0,
          unit: 'AU'
        },
        {
          label: 'Eccentricity',
          value: catalogObject.orbit?.eccentricity || 0
        },
        {
          label: 'Inclination',
          value: catalogObject.orbit?.inclination || 0,
          unit: '°'
        },
        {
          label: 'Orbital Period',
          value: catalogObject.orbit?.period || 0,
          unit: 'days'
        }
      ]
    }
  ]

  // Add object-specific sections based on type
  if (catalogObject.engine_object === 'terrestrial-planet') {
    sections.push({
      title: 'Surface Features',
      items: [
        {
          label: 'Ocean Coverage',
          value: (catalogObject.features?.ocean_coverage || 0) * 100,
          unit: '%'
        },
        {
          label: 'Atmospheric Pressure',
          value: catalogObject.physical?.atmospheric_pressure || 0,
          unit: 'atm'
        },
        {
          label: 'Cloud Coverage',
          value: (catalogObject.features?.cloud_coverage || 0) * 100,
          unit: '%'
        },
        {
          label: 'Surface Gravity',
          value: catalogObject.physical?.surface_gravity || 0,
          unit: 'g'
        }
      ]
    })
  } else if (catalogObject.engine_object?.includes('star')) {
    sections.push({
      title: 'Stellar Properties',
      items: [
        {
          label: 'Spectral Type',
          value: catalogObject.features?.spectral_type || 'Unknown'
        },
        {
          label: 'Luminosity',
          value: catalogObject.physical?.luminosity || 0,
          unit: 'L☉'
        },
        {
          label: 'Metallicity',
          value: catalogObject.features?.metallicity || 0,
          unit: '[Fe/H]'
        },
        {
          label: 'Age',
          value: catalogObject.physical?.age || 0,
          unit: 'Gyr'
        }
      ]
    })
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Object Information</h2>
      
      {/* Object name and description */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          {catalogObject.name}
        </h3>
        <p className="text-gray-400">
          {catalogObject.description}
        </p>
      </div>
      
      {/* Information sections */}
      {sections.map(section => (
        <div key={section.title} className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {section.title}
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            {section.items.map(item => (
              <div key={item.label} className="space-y-1">
                <div className="text-sm text-gray-400">
                  {item.label}
                </div>
                <div className="text-sm font-medium text-white">
                  {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                  {item.unit && <span className="ml-1 text-gray-400">{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 