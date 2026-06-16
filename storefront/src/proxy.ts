import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, Next.js internals, Vercel internals
  // and static assets (pathnames containing a dot, e.g. favicon.ico).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
