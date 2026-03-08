import { NextResponse } from "next/server";

// This app uses AdminI18nProvider / WorkerI18nProvider (client-side React
// contexts) for all translations, so next-intl's URL-rewriting middleware is
// not needed.  A plain pass-through prevents next-intl from internally
// rewriting e.g. "/" → "/en" (a path that doesn't exist in this app) which
// was causing every route to return 404.
export function middleware() {
  return NextResponse.next();
}
