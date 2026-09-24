import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const pathname = request.nextUrl.pathname;

  const isProtectedPath =
    pathname.startsWith("/student") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/admin");

  const isAuthPath =
    pathname === "/login" || pathname === "/signup";

  // 1. Unauthenticated users cannot access protected routes
  if (isProtectedPath && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If logged in and visiting /login or /signup, redirect to appropriate role portal
  if (isAuthPath && user) {
    // Check role in user metadata or profiles
    const role = user.user_metadata?.role || "STUDENT";
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (role === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher", request.url));
    } else {
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
