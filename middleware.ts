import { NextResponse } from "next/server";

export function middleware() {
  // Admin role checks are handled by individual pages using useAuth() hook
  // This prevents the middleware from blocking admins before auth context loads
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
