import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // Only check authentication for dashboard routes
  if (!req.auth && req.nextUrl.pathname.startsWith('/calendar')) {
    console.log(`[Auth] Redirecting ${req.nextUrl.pathname} to login`)
    return NextResponse.redirect(new URL("/login", req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/calendar/:path*",
    "/admin/:path*", 
    "/requests/:path*",
    "/profile",
    "/allowance",
    "/settings/:path*",
    "/team/:path*",
    "/approvals"
  ],
}