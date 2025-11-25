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

  // Routes publiques
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Routes d'authentification
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Routes protégées
  const protectedRoutes = ['/feed', '/collection', '/wishlist', '/profil'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Pour les routes protégées, la vérification se fait côté client
  // Les pages protégées elles-mêmes redirigent si non authentifié

  // Note : Dans une implémentation plus avancée, vous pouvez utiliser
  // des cookies de session pour vérifier l'authentification côté serveur

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
