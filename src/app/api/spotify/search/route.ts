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
  } catch (error) {
    console.error('Erreur dans /api/spotify/search:', error);

    // Retourner une erreur appropriée
    return NextResponse.json(
      {
        error: 'Erreur lors de la recherche',
        message: error instanceof Error ? error.message : 'Une erreur est survenue',
      },
      { status: 500 }
    );
  }
}
