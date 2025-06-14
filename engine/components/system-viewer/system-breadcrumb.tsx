"use client"

import type React from "react"

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
  onBackToStarmap?: () => void
  onSystemNameClick?: () => void
}

export function SystemBreadcrumb({
  systemData,
  objectRefsMap,
  onObjectFocus,
  onObjectSelect,
  focusedName,
  onBackToStarmap,
  onSystemNameClick,
}: SystemBreadcrumbProps) {

  const handleObjectClick = (objectId: string, name: string) => {
    const object = objectRefsMap.current.get(objectId)
    if (object) {
      onObjectFocus(object, name)
      if (onObjectSelect) {
        onObjectSelect(objectId, object, name)
      }
    }
  }

  // Get stars and planets using the system loader helper methods
  const stars = engineSystemLoader.getStars(systemData)
  const planets = engineSystemLoader.getPlanets(systemData)

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-4 py-2 backdrop-blur-md bg-white/10 rounded-full border border-white/20">
        {/* Starmap Button */}
        <button
          onClick={() => onBackToStarmap && onBackToStarmap()}
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 text-white/80 hover:text-white"
        >
          <span className="text-xs font-medium">← Starmap</span>
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
            onClick={() => handleObjectClick(planet.id, planet.name)}
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
    </div>
  )
}
