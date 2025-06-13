import { Star, Circle } from "lucide-react"
import { toRomanNumeral } from "@/lib/roman-numerals"
import type { SystemData } from "@/engine/system-loader"

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
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-auto">
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

        {/* Planets */}
        {systemData.planets?.map((planet, index) => (
          <button
            key={planet.id}
            onClick={() => onObjectClick(planet.id, planet.name, 1.0)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/20 ${
              focusedName === planet.name ? "bg-white/30 text-blue-300" : "text-white/80 hover:text-white"
            }`}
            title={planet.name}
          >
            <Circle size={14} className="fill-current" />
            <span className="text-sm font-medium">{planet.name} {toRomanNumeral(index + 1)}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 