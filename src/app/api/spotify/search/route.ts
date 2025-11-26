import { NextRequest, NextResponse } from 'next/server';
import { searchAlbums } from '@/lib/spotify';

/**
 * Route API pour rechercher des albums sur Spotify
 * GET /api/spotify/search?q=query_string
 *
 * Note: Cette route ne fait QUE la recherche Spotify.
 * Le cache Firestore est géré côté client (AlbumSearch.tsx)
 * car l'API route n'a pas le contexte d'authentification Firebase.
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer le paramètre de recherche
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Validation du paramètre
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le paramètre "q" est requis' },
        { status: 400 }
      );
    }

    // Vérifier la longueur minimale de la query
    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: 'La recherche doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    // Effectuer la recherche sur Spotify
    const albums = await searchAlbums(query);

    // Retourner les résultats Spotify bruts
    return NextResponse.json({
      success: true,
      query,
      count: albums.length,
      results: albums,
    });
  } catch (error: any) {
    console.error('Erreur dans /api/spotify/search:', error);

    // Retourner une erreur appropriée
    return NextResponse.json(
      {
        error: 'Erreur lors de la recherche',
        message: error.message || 'Une erreur est survenue',
      },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting basique (optionnel)
 * Stocke les dernières requêtes par IP
 */
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 60; // 60 requêtes par minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];

  // Filtrer les requêtes dans la fenêtre de temps
  const recentRequests = requests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Vérifier la limite
  if (recentRequests.length >= MAX_REQUESTS) {
    return false; // Rate limit dépassé
  }

  // Ajouter la requête actuelle
  recentRequests.push(now);
  requestLog.set(ip, recentRequests);

  // Nettoyer les anciennes entrées (optionnel)
  if (requestLog.size > 1000) {
    const oldestKey = requestLog.keys().next().value;
    requestLog.delete(oldestKey);
  }

  return true; // OK
}
