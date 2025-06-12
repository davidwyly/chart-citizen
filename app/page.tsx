import { redirect } from "next/navigation"

export default function RootPage() {
  // Redirect to the default mode (realistic)
  redirect("/realistic")
}

export const metadata = {
  title: "3D Starfield Background",
  description: "Interactive 3D space simulation with realistic and Star Citizen modes",
}
