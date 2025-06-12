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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-3 px-4 py-2 backdrop-blur-md bg-white/10 rounded-full border border-white/20">
        {/* Stars */}
        {systemData.stars?.map((star) => (
          <button
            key={star.id}
            onClick={() => onObjectClick(star.id, star.name, 1.0)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 ${
              focusedName === star.name ? "bg-white/30 text-yellow-300" : "text-white/80 hover:text-white"
            }`}
            title={star.name}
          >
            <Star size={16} className="fill-current" />
          </button>
        ))}

        {/* Separator */}
        {systemData.stars && systemData.planets && systemData.planets.length > 0 && (
          <div className="w-px h-4 bg-white/30" />
        )}

        {/* Planets */}
        {systemData.planets?.map((planet, index) => (
          <button
            key={planet.id}
            onClick={() => onObjectClick(planet.id, planet.name, 1.0)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-white/20 ${
              focusedName === planet.name ? "bg-white/30 text-blue-300" : "text-white/80 hover:text-white"
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