import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("vendapro_token")?.value;
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC.some((r) => pathname.startsWith(r));
  if (!token && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  if (token && isPublic) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
