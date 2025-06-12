import { notFound } from "next/navigation"
import { RealisticModeView } from "./realistic/realistic-mode-view"
import { StarCitizenModeView } from "./star-citizen/star-citizen-mode-view"

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
      return <RealisticModeView />
    case "star-citizen":
      return <StarCitizenModeView />
    default:
      notFound()
  }
}

export function generateStaticParams() {
  return validModes.map((mode) => ({
    mode,
  }))
}

export async function generateMetadata({ params: { mode } }: PageProps) {
  const titles = {
    realistic: "Realistic Universe - Chart Citizen",
    "star-citizen": "Star Citizen Universe - Chart Citizen"
  }

  const descriptions = {
    realistic: "Scientifically accurate 3D space simulation and exploration",
    "star-citizen": "Star Citizen game-inspired 3D universe exploration"
  }

  if (!isValidMode(mode)) {
    return {
      title: "Not Found - Chart Citizen",
      description: "The requested page could not be found."
    }
  }

  return {
    title: titles[mode],
    description: descriptions[mode],
  }
}
