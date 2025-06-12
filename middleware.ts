import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Redirect root path to /realistic
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/realistic", request.url))
  }
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
}
