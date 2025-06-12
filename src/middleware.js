import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) =>
          res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.delete({ name, ...options }),
      },
    }
  );
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Define public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/signup", "/auth/callback"];
    const isPublicRoute = publicRoutes.some(
      (route) =>
        req.nextUrl.pathname === route ||
        req.nextUrl.pathname.startsWith("/auth/")
    );

    // If user is not signed in and trying to access a protected route
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("returnTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is signed in and trying to access public routes
    if (
      session &&
      (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return res;
  } catch (error) {
    console.error("Auth error in middleware:", error);
    
    // Clear invalid auth cookies if there's a refresh token error
    if (error.message?.includes("Refresh Token Not Found") || 
        error.code === "refresh_token_not_found") {
      res.cookies.delete("sb-access-token");
      res.cookies.delete("sb-refresh-token");
      
      // Only redirect to login for protected routes
      const publicRoutes = ["/", "/login", "/signup", "/auth/callback"];
      const isPublicRoute = publicRoutes.some(
        (route) =>
          req.nextUrl.pathname === route ||
          req.nextUrl.pathname.startsWith("/auth/")
      );
      
      if (!isPublicRoute) {
        const redirectUrl = new URL("/login", req.url);
        redirectUrl.searchParams.set("returnTo", req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
