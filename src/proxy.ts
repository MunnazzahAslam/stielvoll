import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 calls this file "proxy" (formerly middleware).
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, the (English-only) admin, Next internals and files with an extension.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
