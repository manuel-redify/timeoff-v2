import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // Allow access to public routes
  const publicPaths = [
    '/login',
    '/api/auth',
  ]
  
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  // Redirect to login if not authenticated and not accessing public paths
  if (!req.auth && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}