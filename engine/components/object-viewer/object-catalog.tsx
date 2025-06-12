import { useMemo } from 'react'

interface ObjectCatalogProps {
  selectedObjectId: string
  onObjectSelect: (id: string) => void
}

interface CatalogCategory {
  name: string
  objects: Array<{
    id: string
    name: string
    description: string
    category: string
    subtype: string
  }>
}

export function ObjectCatalog({ selectedObjectId, onObjectSelect }: ObjectCatalogProps) {
  // Organize objects by category
  const categories = useMemo<CatalogCategory[]>(() => [
    {
      name: 'Stars',
      objects: [
        {
          id: 'g2v-main-sequence',
          name: 'G2V Main Sequence Star',
          description: 'A yellow main sequence star like our Sun',
          category: 'main_sequence',
          subtype: 'g2v'
        },
        {
          id: 'm2v-red-dwarf',
          name: 'M2V Red Dwarf',
          description: 'A small, cool red dwarf star',
          category: 'main_sequence',
          subtype: 'm2v'
        },
        {
          id: 'variable-star',
          name: 'Variable Star',
          description: 'A pulsating variable star with changing brightness',
          category: 'variable',
          subtype: 'cepheid'
        }
      ]
    },
    {
      name: 'Terrestrial Planets',
      objects: [
        {
          id: 'terrestrial-rocky',
          name: 'Terrestrial Rocky Planet',
          description: 'An Earth-like rocky planet with atmosphere',
          category: 'terrestrial',
          subtype: 'rocky'
        },
        {
          id: 'terrestrial-oceanic',
          name: 'Oceanic Planet',
          description: 'A water-rich world with global oceans',
          category: 'terrestrial',
          subtype: 'oceanic'
        },
        {
          id: 'smog-planet',
          name: 'Smog Planet',
          description: 'A Venus-like world with thick atmosphere',
          category: 'terrestrial',
          subtype: 'smog'
        }
      ]
    },
    {
      name: 'Gas Giants',
      objects: [
        {
          id: 'gas-giant',
          name: 'Gas Giant',
          description: 'A massive Jupiter-like planet',
          category: 'jovian',
          subtype: 'gas-giant'
        },
        {
          id: 'ice-giant',
          name: 'Ice Giant',
          description: 'A Neptune-like planet with icy composition',
          category: 'jovian',
          subtype: 'ice-giant'
        }
      ]
    },
    {
      name: 'Moons',
      objects: [
        {
          id: 'rocky-moon',
          name: 'Rocky Moon',
          description: 'A barren rocky satellite',
          category: 'moon',
          subtype: 'rocky'
        },
        {
          id: 'ice-moon',
          name: 'Icy Moon',
          description: 'A moon with icy surface and subsurface ocean',
          category: 'moon',
          subtype: 'icy'
        }
      ]
    },
    {
      name: 'Special Objects',
      objects: [
        {
          id: 'black-hole',
          name: 'Black Hole',
          description: 'A supermassive black hole with accretion disk',
          category: 'compact_object',
          subtype: 'black_hole'
        },
        {
          id: 'raymarched-black-hole',
          name: 'Raymarched Black Hole',
          description: 'Advanced black hole with gravitational lensing and realistic accretion disk',
          category: 'compact_object',
          subtype: 'raymarched_black_hole'
        },
        {
          id: 'neutron-star',
          name: 'Neutron Star',
          description: 'A dense stellar remnant with intense magnetic field',
          category: 'compact_object',
          subtype: 'neutron_star'
        },
        {
          id: 'asteroid-belt',
          name: 'Asteroid Belt',
          description: 'A region of rocky debris and small bodies',
          category: 'belt',
          subtype: 'asteroid'
        }
      ]
    }
  ], [])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Celestial Objects</h2>
      
      {categories.map(category => (
        <div key={category.name} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {category.name}
          </h3>
          
          <div className="space-y-1">
            {category.objects.map(object => (
              <button
                key={object.id}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedObjectId === object.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
                onClick={() => onObjectSelect(object.id)}
              >
                <div className="font-medium">{object.name}</div>
                <div className="text-sm text-gray-400 line-clamp-2">
                  {object.description}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {object.category} / {object.subtype}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 