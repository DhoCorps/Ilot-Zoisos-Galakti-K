import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// On définit les langues de l'Îlot
const locales = ['fr', 'en'];
const defaultLocale = 'fr'; 

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // 1. On vérifie si l'URL contient déjà une langue reconnue
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // 2. Si l'oiseau a oublié la locale, on le redirige doucement vers la VF
    if (!pathnameHasLocale) {
      const url = req.nextUrl.clone();
      url.pathname = `/${defaultLocale}${pathname}`;
      return NextResponse.redirect(url);
    }

    // 3. Tout est en ordre, on laisse passer
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      // 🛡️ On s'assure que la redirection vers le login atterrit bien sur une route avec locale !
      signIn: `/${defaultLocale}/auth/login`, 
    },
  }
);

// 🎯 LE RADAR (On protège les routes sensibles)
export const config = {
  matcher: [
    // 1. On attrape les routes SANS locale (celles qui faisaient des 404)
    "/dashboard/:path*",
    "/tom-hat-toes/:path*",
    "/projects/:path*",
    "/teams/:path*",
    
    // 2. On attrape les routes AVEC locale (pour vérifier le token)
    "/:locale(fr|en)/dashboard/:path*",
    "/:locale(fr|en)/tom-hat-toes/:path*",
    "/:locale(fr|en)/projects/:path*",
    "/:locale(fr|en)/teams/:path*",
  ],
};