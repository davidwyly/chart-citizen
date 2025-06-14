import { Star, Circle, ChevronDown, ChevronRight } from "lucide-react"
import { toRomanNumeral } from "@/lib/roman-numerals"
import type { SystemData } from "@/engine/system-loader"
import { useState, useMemo } from "react"

interface SystemNavigationBarProps {
  systemData: SystemData
  focusedName: string | null
  onObjectClick: (objectId: string, name: string, radius: number) => void
}

export function SystemNavigationBar({
  systemData,
  focusedName,
  onObjectClick
}: SystemNavigationBarProps) {
  const [expandedPlanets, setExpandedPlanets] = useState<Set<string>>(new Set())

  // Group moons by their parent planet
  const moonsByParent = useMemo(() => {
    if (!systemData.moons) return {}
    
    return systemData.moons.reduce((acc, moon) => {
      if (!moon.orbit?.parent) return acc
      
      if (!acc[moon.orbit.parent]) {
        acc[moon.orbit.parent] = []
      }
      acc[moon.orbit.parent].push(moon)
      return acc
    }, {} as Record<string, typeof systemData.moons>)
  }, [systemData.moons])

  const togglePlanetExpansion = (planetId: string) => {
    setExpandedPlanets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(planetId)) {
        newSet.delete(planetId)
      } else {
        newSet.add(planetId)
      }
      return newSet
    })
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-4xl">
      <div className="flex items-center justify-center gap-3 px-6 py-3 backdrop-blur-lg bg-black/20 rounded-full border border-white/20 shadow-lg">
        {/* Stars */}
        {systemData.stars?.map((star) => (
          <button
            key={star.id}
            onClick={() => onObjectClick(star.id, star.name, 1.0)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/20 ${
              focusedName === star.name ? "bg-white/30 text-yellow-300" : "text-white/80 hover:text-white"
            }`}
            title={star.name}
          >
            <Star size={18} className="fill-current" />
            <span className="text-sm font-medium">{star.name}</span>
          </button>
        ))}

        {/* Separator */}
        {systemData.stars && systemData.planets && systemData.planets.length > 0 && (
          <div className="w-px h-6 bg-white/30" />
        )}

        {/* Planets with expandable moons */}
        {systemData.planets?.map((planet, index) => {
          const planetMoons = moonsByParent[planet.id] || []
          const hasMoons = planetMoons.length > 0
          const isExpanded = expandedPlanets.has(planet.id)
          const planetSelected = focusedName === planet.name
          const anyMoonSelected = planetMoons.some(moon => focusedName === moon.name)

          return (
            <div key={planet.id} className="relative">
              {/* Planet Button */}
              <div className="flex items-center">
                <button
                  onClick={() => onObjectClick(planet.id, planet.name, 1.0)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/20 ${
                    planetSelected ? "bg-white/30 text-blue-300" : anyMoonSelected ? "bg-blue-500/20 text-blue-200" : "text-white/80 hover:text-white"
                  }`}
                  title={planet.name}
                >
                  <Circle size={14} className="fill-current" />
                  <span className="text-sm font-medium">{planet.name} {toRomanNumeral(index + 1)}</span>
                </button>
                
                {/* Expand/Collapse button for moons */}
                {hasMoons && (
                  <button
                    onClick={() => togglePlanetExpansion(planet.id)}
                    className="ml-1 p-1 rounded-full hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200"
                    title={`${isExpanded ? 'Hide' : 'Show'} moons`}
                  >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                )}
              </div>

              {/* Moon dropdown */}
              {hasMoons && isExpanded && (
                <div className="absolute top-full left-0 mt-2 min-w-48 bg-black/90 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg z-60 py-2">
                  <div className="text-white/60 text-xs font-medium px-3 py-1 border-b border-white/20 mb-1">
                    {planet.name} Moons ({planetMoons.length})
                  </div>
                  {planetMoons.map((moon) => (
                    <button
                      key={moon.id}
                      onClick={() => onObjectClick(moon.id, moon.name, 0.3)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-all duration-200 ${
                        focusedName === moon.name ? "bg-white/20 text-purple-300" : "text-white/80 hover:text-white"
                      }`}
                      title={moon.name}
                    >
                      <Circle size={10} className="fill-current text-purple-300 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{moon.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 