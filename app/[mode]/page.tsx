import { notFound, redirect } from "next/navigation"

const validModes = ["realistic", "star-citizen"] as const
type ValidMode = (typeof validModes)[number]

function isValidMode(mode: string): mode is ValidMode {
  return validModes.includes(mode as ValidMode)
}

interface PageProps {
  params: Promise<{
    mode: string
  }>
}

export default async function ModePage({ params }: PageProps) {
  const { mode } = await params
  
  if (!isValidMode(mode)) {
    notFound()
  }

  // Redirect to starmap as the default entry point for each mode
  redirect(`/${mode}/starmap`)
}

export function generateStaticParams() {
  return validModes.map((mode) => ({
    mode,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { mode } = await params
  
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
