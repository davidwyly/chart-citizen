import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Map, Home, ArrowLeft } from "lucide-react"

interface ModeNavigationProps {
  mode: "realistic" | "star-citizen"
  className?: string
}

export function ModeNavigation({ mode, className }: ModeNavigationProps) {
  return (
    <div className={`fixed top-4 left-4 z-50 flex gap-2 ${className || ""}`}>
      <Link href="/">
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Home
        </Button>
      </Link>
      
      <Link href={`/${mode}/starmap`}>
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
        >
          <Map className="w-4 h-4 mr-2" />
          Starmap
        </Button>
      </Link>
      
      <Link href={`/${mode}/system-viewer`}>
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
        >
          <Home className="w-4 h-4 mr-2" />
          System View
        </Button>
      </Link>
    </div>
  )
} 