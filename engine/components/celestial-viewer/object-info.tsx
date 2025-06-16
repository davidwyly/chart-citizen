"use client"

import React from 'react'
import type { CelestialObject } from '@/engine/types/orbital-system'

interface ObjectInfoProps {
  selectedObjectId: string
  celestialObject: CelestialObject | null
}

export function ObjectInfo({ selectedObjectId, celestialObject }: ObjectInfoProps) {
  const formatValue = (value: any, unit?: string): string => {
    if (typeof value === 'number') {
      return `${value.toFixed(3)}${unit ? ` ${unit}` : ''}`
    }
    return String(value)
  }

  if (!celestialObject) {
    return (
      <div className="flex h-full flex-col p-4">
        <h2 className="mb-4 text-lg font-semibold">Object Information</h2>
        <div className="text-gray-400">
          {selectedObjectId === 'black-hole' ? (
            <div>
              <h3 className="text-md font-medium text-gray-200 mb-2">Black Hole</h3>
              <p className="text-sm">A black hole with gravitational lensing effects and accretion disk visualization.</p>
            </div>
          ) : selectedObjectId === 'protostar' ? (
            <div>
              <h3 className="text-md font-medium text-gray-200 mb-2">Protostar</h3>
              <p className="text-sm">A forming star with nebula clouds and particle effects showing stellar birth processes.</p>
            </div>
          ) : (
            <p>Select an object to view its information.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4 overflow-y-auto">
      <h2 className="mb-4 text-lg font-semibold">Object Information</h2>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <h3 className="text-md font-medium text-gray-200 mb-2">{celestialObject.name}</h3>
          <div className="flex gap-2 mb-3">
            <span className="px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded">
              {celestialObject.classification}
            </span>
            {celestialObject.geometry_type && (
              <span className="px-2 py-1 border border-gray-600 text-gray-300 text-xs rounded">
                {celestialObject.geometry_type}
              </span>
            )}
          </div>
        </div>

        {/* Physical Properties */}
        {celestialObject.properties && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 border-b border-gray-700 pb-1">Physical Properties</h4>
            <div className="space-y-1 text-sm">
              {celestialObject.properties.mass !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Mass:</span>
                  <span className="text-gray-200">{formatValue(celestialObject.properties.mass, 'M☉')}</span>
                </div>
              )}
              {celestialObject.properties.radius !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Radius:</span>
                  <span className="text-gray-200">{formatValue(celestialObject.properties.radius, 'km')}</span>
                </div>
              )}
              {celestialObject.properties.temperature !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Temperature:</span>
                  <span className="text-gray-200">{formatValue(celestialObject.properties.temperature, 'K')}</span>
                </div>
              )}
              {celestialObject.properties.luminosity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Luminosity:</span>
                  <span className="text-gray-200">{formatValue(celestialObject.properties.luminosity, 'L☉')}</span>
                </div>
              )}
              {celestialObject.properties.age !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Age:</span>
                  <span className="text-gray-200">{formatValue(celestialObject.properties.age, 'Gyr')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Composition */}
        {celestialObject.properties.composition && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 border-b border-gray-700 pb-1">Composition</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(celestialObject.properties.composition).map(([element, fraction]) => (
                <div key={element} className="flex justify-between">
                  <span className="text-gray-400 capitalize">{element}:</span>
                  <span className="text-gray-200">{formatValue(fraction)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {celestialObject.properties.features && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 border-b border-gray-700 pb-1">Features</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(celestialObject.properties.features).map(([feature, value]) => (
                <div key={feature} className="flex justify-between">
                  <span className="text-gray-400 capitalize">{feature.replace(/_/g, ' ')}:</span>
                  <span className="text-gray-200">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appearance */}
        {celestialObject.properties.appearance && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 border-b border-gray-700 pb-1">Appearance</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(celestialObject.properties.appearance).map(([property, value]) => (
                <div key={property} className="flex justify-between items-center">
                  <span className="text-gray-400 capitalize">{property.replace(/_/g, ' ')}:</span>
                  <div className="flex items-center gap-2">
                    {typeof value === 'string' && value.startsWith('#') && (
                      <div 
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: value }}
                      />
                    )}
                    <span className="text-gray-200">{String(value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 