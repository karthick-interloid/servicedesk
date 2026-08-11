import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/config/env";

export async function proxy(request: NextRequest) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet, headers) {
        /*
         * 1. Update request cookies.
         *
         * This makes the refreshed session available to
         * downstream server code during this request.
         */
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        /*
         * 2. Recreate the response using the updated request.
         */
        response = NextResponse.next({
          request,
        });

        /*
         * 3. Send refreshed cookies back to browser.
         */
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        /*
         * 4. Preserve cache-control / other headers
         * supplied by @supabase/ssr during refresh.
         */
        if (headers) {
          for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
          }
        }
      },
    },
  });

  /*
   * Verify the JWT and refresh the session when necessary.
   *
   * Do NOT use getSession() here.
   */
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
