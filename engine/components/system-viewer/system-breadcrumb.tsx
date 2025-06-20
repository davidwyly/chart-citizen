"use client"

import React, { useState, useEffect } from "react"

import { Star, Circle } from "lucide-react"
import { toRomanNumeral } from "@/lib/roman-numerals"
import { OrbitalSystemData } from "@/engine/types/orbital-system"
import { engineSystemLoader } from "@/engine/system-loader"
import type * as THREE from "three"

interface SystemBreadcrumbProps {
  systemData: OrbitalSystemData
  objectRefsMap: React.MutableRefObject<Map<string, THREE.Object3D>>
  onObjectFocus: (object: THREE.Object3D, name: string, visualSize?: number, radius?: number) => void
  onObjectSelect?: (objectId: string, object: THREE.Object3D, name: string) => void
  focusedName: string
  onNavigateBack?: () => void
  onSystemNameClick?: () => void
  // Add function to get object sizing for consistency
  getObjectSizing?: (objectId: string) => { visualSize: number }
}

export function SystemBreadcrumb({
  systemData,
  objectRefsMap,
  onObjectFocus,
  onObjectSelect,
  focusedName,
  onNavigateBack,
  onSystemNameClick,
  getObjectSizing,
}: SystemBreadcrumbProps) {
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null)

  const handleObjectClick = (objectId: string, name: string) => {
    console.log('🍞 BREADCRUMB CLICKED:', name)
    console.log('  🆔 Object ID:', objectId)
    
    const object = objectRefsMap.current.get(objectId)
    if (object) {
      console.log('  📍 Found object in refs map')
      // ⚠️ CRITICAL: Get visual size for current view mode to ensure camera framing consistency
      // This must match the visual size calculation used by the geometry renderers
      const visualSize = getObjectSizing ? getObjectSizing(objectId).visualSize : undefined
      
      // Get object properties for additional parameters
      const objectData = systemData.objects.find(obj => obj.id === objectId)
      const radius = objectData?.properties?.radius
      
      console.log('  📏 Visual size:', visualSize)
      console.log('  📐 Radius:', radius)
      console.log('  📊 Object data:', objectData)
      
      // ⚠️ CRITICAL: Call onObjectFocus BEFORE onObjectSelect to avoid race conditions
      // The order matters: focus sets the visual size, select preserves it
      console.log('  🎯 Calling onObjectFocus...')
      onObjectFocus(object, name, visualSize, radius)
      if (onObjectSelect) {
        console.log('  🖱️ Calling onObjectSelect...')
        onObjectSelect(objectId, object, name)
      }
    }
  }

  const handlePlanetClick = (planetId: string, planetName: string) => {
    // Handle planet selection
    handleObjectClick(planetId, planetName)
    
    // Check if this planet has moons to show sub-nav
    const planetMoons = getMoonsForPlanet(planetId)
    if (planetMoons.length > 0) {
      setSelectedPlanetId(planetId)
    } else {
      setSelectedPlanetId(null)
    }
  }

  // Get moons for a specific planet
  const getMoonsForPlanet = (planetId: string) => {
    return engineSystemLoader.getObjectsByParent(systemData, planetId)
      .filter(obj => obj.classification === 'moon')
  }

  // Format moon name with planet number + letter (e.g., "1A", "2B")
  const formatMoonName = (planetIndex: number, moonIndex: number) => {
    const planetNumeral = toRomanNumeral(planetIndex + 1)
    const moonLetter = String.fromCharCode(65 + moonIndex) // A, B, C, etc.
    return `${planetNumeral}${moonLetter}`
  }

  // Update selected planet when focused object changes
  useEffect(() => {
    const planets = engineSystemLoader.getPlanets(systemData)
    
    // Check if focused object is a planet
    const focusedPlanet = planets.find(planet => planet.name === focusedName)
    
    if (focusedPlanet) {
      // Planet is focused - show its moons if it has any
      const planetMoons = getMoonsForPlanet(focusedPlanet.id)
      if (planetMoons.length > 0) {
        setSelectedPlanetId(focusedPlanet.id)
      } else {
        setSelectedPlanetId(null)
      }
    } else {
      // Check if focused object is a moon
      const focusedMoon = systemData.objects.find(obj => 
        obj.name === focusedName && obj.classification === 'moon'
      )
      
      if (focusedMoon && focusedMoon.orbit?.parent) {
        // Moon is focused - find its parent planet and show that planet's moons
        const parentPlanet = planets.find(planet => planet.id === focusedMoon.orbit?.parent)
        
        if (parentPlanet) {
          const planetMoons = getMoonsForPlanet(parentPlanet.id)
          if (planetMoons.length > 0) {
            setSelectedPlanetId(parentPlanet.id)
          } else {
            setSelectedPlanetId(null)
          }
        } else {
          setSelectedPlanetId(null)
        }
      } else {
        // Neither planet nor moon is focused - hide moon navigation
        setSelectedPlanetId(null)
      }
    }
  }, [focusedName, systemData])

  // Get stars and planets using the system loader helper methods
  const stars = engineSystemLoader.getStars(systemData)
  const planets = engineSystemLoader.getPlanets(systemData)

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Main breadcrumb */}
      <div className="flex items-center gap-3 px-4 py-2 backdrop-blur-md bg-white/10 rounded-full border border-white/20">
        {/* Back Button */}
        <button
          onClick={() => onNavigateBack && onNavigateBack()}
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 text-white/80 hover:text-white"
        >
          <span className="text-xs font-medium">← Back</span>
        </button>

        {/* Separator */}
        <div className="w-px h-4 bg-white/30" />

        {/* System Name - now clickable */}
        <button
          onClick={() => onSystemNameClick && onSystemNameClick()}
          className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 hover:text-yellow-100"
          title="Click to view entire system"
        >
          <span className="text-xs font-medium">{systemData?.name || "Unknown System"}</span>
        </button>

        {/* Separator - only if we have celestial objects */}
        {((stars && stars.length > 0) || (planets && planets.length > 0)) && (
          <div className="w-px h-4 bg-white/30" />
        )}

        {/* Stars */}
        {stars?.map((star) => (
          <button
            key={star.id}
            onClick={() => handleObjectClick(star.id, star.name)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 ${
              focusedName === star.name ? "bg-yellow-600/40 text-yellow-100 border border-yellow-400/50" : "text-white/80 hover:text-white"
            }`}
            title={star.name}
          >
            <Star size={16} className="fill-current" />
          </button>
        ))}

        {/* Separator */}
        {stars && planets && planets.length > 0 && (
          <div className="w-px h-4 bg-white/30" />
        )}

        {/* Planets */}
        {planets?.map((planet, index) => (
          <button
            key={planet.id}
            onClick={() => handlePlanetClick(planet.id, planet.name)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 ${
              focusedName === planet.name ? "bg-blue-600/40 text-blue-100 border border-blue-400/50" : "text-white/80 hover:text-white"
            }`}
            title={planet.name}
          >
            <Circle size={12} className="fill-current" />
            <span className="text-xs font-medium">{toRomanNumeral(index + 1)}</span>
          </button>
        ))}
      </div>

      {/* Moon sub-navigation - slides down from selected planet */}
      {selectedPlanetId && (
        <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/10 rounded-full border border-white/20">
            {/* Moon label */}
            <span className="text-xs font-medium text-white/60">
              Moons:
            </span>
            
            {/* Moon buttons */}
            {(() => {
              const planetIndex = planets.findIndex(p => p.id === selectedPlanetId)
              const moons = getMoonsForPlanet(selectedPlanetId)
              
              return moons.map((moon, moonIndex) => (
                <button
                  key={moon.id}
                  onClick={() => handleObjectClick(moon.id, moon.name)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 ${
                    focusedName === moon.name ? "bg-purple-600/40 text-purple-100 border border-purple-400/50" : "text-white/80 hover:text-white"
                  }`}
                  title={moon.name}
                >
                  <Circle size={8} className="fill-current" />
                  <span className="text-xs font-medium">
                    {formatMoonName(planetIndex, moonIndex)}
                  </span>
                </button>
              ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
