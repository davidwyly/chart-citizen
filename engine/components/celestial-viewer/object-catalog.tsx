"use client"

import { useState } from 'react'

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
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Stars', 'Terrestrial Planets', 'Gas Giants', 'Special Objects'])

  // Organize objects by category
  const categories: CatalogCategory[] = [
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
          id: 'protostar',
          name: 'Protostar',
          description: 'A young star forming within a dusty nebula with volumetric effects',
          category: 'protostar',
          subtype: 'protostar'
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
          id: 'gas-giant-ice',
          name: 'Ice Giant',
          description: 'A Neptune-like planet with icy composition',
          category: 'jovian',
          subtype: 'ice-giant'
        }
      ]
    },
    {
      name: 'Special Objects',
      objects: [
        {
          id: 'black-hole',
          name: 'Black Hole',
          description: 'Advanced black hole with gravitational lensing and realistic accretion disk',
          category: 'compact_object',
          subtype: 'black_hole'
        }
      ]
    }
  ]

  // Filter objects based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    objects: category.objects.filter(obj =>
      obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.objects.length > 0)

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold">Celestial Objects</h2>
      
      <input
        type="text"
        placeholder="Search objects..."
        className="mb-4 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map(category => (
          <div key={category.name} className="mb-4">
            <button
              className="flex w-full items-center justify-between px-3 py-2 text-md font-medium text-gray-200 hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => toggleCategory(category.name)}
            >
              <span>{category.name}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${expandedCategories.includes(category.name) ? 'rotate-180' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {expandedCategories.includes(category.name) && (
              <div className="mt-2 space-y-1 pl-4">
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
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 