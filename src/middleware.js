import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user?.id);

  if ((pathname === "/login" || pathname === "/") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (
    !isLoggedIn &&
    ["/dashboard", "/game", "/profile", "/admin"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin role ตรวจที่ server-side (requireAdmin) — ไม่ใช้ JWT role ที่ edge

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/game/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
