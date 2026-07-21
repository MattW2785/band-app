import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/epk"];
// Chiamate da un cron esterno (bearer CRON_SECRET, controllato nel route handler stesso),
// non da un utente con sessione: vanno escluse dal check sessione Supabase qui sotto.
const CRON_PATHS = ["/api/cron/publish", "/api/cron/refresh-tokens"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (CRON_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("suspended").eq("id", user.id).maybeSingle();
    if (profile?.suspended) {
      // Invalida la sessione prima di reindirizzare: senza signOut il cookie resterebbe
      // valido e il redirect "user loggato su /login → /" qui sotto causerebbe un loop.
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(new URL("/login?error=suspended", request.url));
      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      }
      return redirectResponse;
    }
  }

  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
