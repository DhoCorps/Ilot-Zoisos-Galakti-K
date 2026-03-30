import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const locales = ['fr', 'en'];
const defaultLocale = 'fr'; 

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // 1. Analyse de la trajectoire : présence d'une locale ?
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // 2. Redirection si pas de locale (ex: /dashboard -> /fr/dashboard)
    if (!pathnameHasLocale) {
      return NextResponse.redirect(
        new URL(`/${defaultLocale}${pathname}`, req.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        
        // ACCÈS PUBLIC : On autorise la racine et les pages d'accueil localisées
        const isPublicPage = pathname === '/' || locales.some(l => pathname === `/${l}`);
        if (isPublicPage) return true;

        // Pour tous les autres secteurs (Dashboard, Teams, Tom-Hat-Toes), token requis.
        return !!token;
      },
    },
    pages: {
      // Point d'entrée pour les oiseaux non identifiés
      signIn: `/${defaultLocale}/auth/login`, 
    },
  }
);

export const config = {
  matcher: [
    // On active le radar sur la racine pour forcer le passage à /fr
    "/",

    // Secteurs sans locale (redirection vers locale)
    "/dashboard/:path*",
    "/projects/:path*",
    "/teams/:path*",
    "/tom-hat-toes/:path*",
    
    // Secteurs avec locale (vérification du jeton)
    "/:locale(fr|en)/dashboard/:path*",
    "/:locale(fr|en)/projects/:path*",
    "/:locale(fr|en)/teams/:path*",
    "/:locale(fr|en)/tom-hat-toes/:path*",
  ],
};