import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  
  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  // Redirect authenticated users to dashboard
  redirect("/dashboard")
}