import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Rocket, Globe, Eye } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Chart Citizen
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Explore the cosmos through interactive 3D visualizations. Choose your adventure below.
          </p>
        </div>

        {/* App Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Realistic Mode */}
          <Link href="/realistic/starmap" className="group">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mb-6">
                <Globe className="w-16 h-16 text-blue-400 mx-auto group-hover:text-blue-300 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Realistic Universe</h2>
              <p className="text-blue-200 mb-6 leading-relaxed">
                Scientifically accurate solar system simulation with real astronomical data and physics.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white transition-all duration-300"
              >
                Explore Reality
              </Button>
            </div>
          </Link>

          {/* Star Citizen Mode */}
          <Link href="/star-citizen/starmap" className="group">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mb-6">
                <Rocket className="w-16 h-16 text-purple-400 mx-auto group-hover:text-purple-300 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Star Citizen Universe</h2>
              <p className="text-blue-200 mb-6 leading-relaxed">
                Explore the Star Citizen game universe with its unique star systems and celestial bodies.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white transition-all duration-300"
              >
                Enter the Verse
              </Button>
            </div>
          </Link>

          {/* Celestial Viewer */}
          <Link href="/celestial-viewer" className="group">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mb-6">
                <Eye className="w-16 h-16 text-green-400 mx-auto group-hover:text-green-300 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Celestial Viewer</h2>
              <p className="text-blue-200 mb-6 leading-relaxed">
                Interactive catalog of celestial objects with detailed 3D models and educational content.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-green-400 text-green-400 hover:bg-green-400 hover:text-white transition-all duration-300"
              >
                View Objects
              </Button>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-blue-300/60 text-sm">
          <p>Built with Next.js, Three.js, and React Three Fiber</p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: "Chart Citizen - Interactive 3D Space Exploration",
  description: "Explore the cosmos through interactive 3D visualizations of realistic and Star Citizen universes, plus detailed celestial object viewing.",
}
