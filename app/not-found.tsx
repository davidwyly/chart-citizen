import Link from "next/link"

export default function NotFound() {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-xl mb-2">Invalid Universe Mode</div>
        <div className="text-gray-400 text-sm mb-4">The requested universe mode does not exist.</div>
        <div className="space-y-2">
          <Link href="/realistic" className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Realistic Universe
          </Link>
          <Link href="/star-citizen" className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Star Citizen Universe
          </Link>
        </div>
      </div>
    </div>
  )
}
