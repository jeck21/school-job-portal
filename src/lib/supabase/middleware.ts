import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() not getSession() -- getUser() revalidates with Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes: redirect unauthenticated users to login
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/for-schools/dashboard")
  ) {
    return NextResponse.redirect(
      new URL("/for-schools/login", request.url)
    );
  }

  return response;
}
