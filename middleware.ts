import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware pour la protection des routes
 *
 * Routes publiques : /, /login, /signup
 * Routes protégées : /feed, /collection, /wishlist, /profil/*
 *
 * Note : La vérification réelle de l'authentification se fait côté client
 * car Firebase Auth est principalement client-side. Ce middleware gère
 * principalement les redirections basées sur les patterns de routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/feed', '/collection', '/wishlist', '/profil'];

  // Vérifie un cookie "token" simulant la session
  const token = request.cookies.get('token')?.value;

  // Redirection vers login si route protégée et pas de token
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirection vers /feed si utilisateur déjà connecté visite /, /login ou /signup
  const isAuthRoute = ['/', '/login', '/signup'].includes(pathname);
  if (isAuthRoute && token) {
    const feedUrl = new URL('/feed', request.url);
    return NextResponse.redirect(feedUrl);
  }

  return NextResponse.next();
}

/**
 * Configuration du matcher pour les routes à traiter
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (API routes)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - Fichiers publics (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
