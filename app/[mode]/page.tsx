import { notFound } from "next/navigation"
import { RealisticApp } from "@/apps/realistic/realistic-app"
import { StarCitizenApp } from "@/apps/star-citizen/star-citizen-app"

const validModes = ["realistic", "star-citizen"] as const
type ValidMode = (typeof validModes)[number]

function isValidMode(mode: string): mode is ValidMode {
  return validModes.includes(mode as ValidMode)
}

interface PageProps {
  params: {
    mode: string
  }
}

export default async function ModePage({ params: { mode } }: PageProps) {
  if (!isValidMode(mode)) {
    notFound()
  }

  switch (mode) {
    case "realistic":
      return <RealisticApp />
    case "star-citizen":
      return <StarCitizenApp />
    default:
      notFound()
  }
}

export function generateStaticParams() {
  return validModes.map((mode) => ({
    mode,
  }))
}

// Handle root path redirect
export async function generateMetadata() {
  return {
    title: "3D Starfield Background",
    description: "Interactive 3D space simulation",
  }
}
