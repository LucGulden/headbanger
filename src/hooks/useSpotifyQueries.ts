import { useQuery } from '@tanstack/react-query';
import type { SpotifyAlbumData } from '@/types/album';

/**
 * Hook React Query pour rechercher des albums sur Spotify
 *
 * Features:
 * - Cache automatique des résultats (1 heure)
 * - Pas de requêtes dupliquées pour la même query
 * - Refetch automatique si cache stale
 *
 * @param query - Terme de recherche
 * @param enabled - Active/désactive la query (utile pour debounce)
 */
export function useSearchAlbums(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['spotify', 'search', query],

    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la recherche');
      }

      const data = await response.json();
      return (data.results || []) as SpotifyAlbumData[];
    },

    // Query active uniquement si enabled=true ET query non vide
    enabled: enabled && query.trim().length > 0,

    // Cache valide pendant 1 heure (résultats de recherche)
    staleTime: 60 * 60 * 1000,

    // Garbage collection après 2 heures
    gcTime: 2 * 60 * 60 * 1000,

    // Pas de retry automatique pour les recherches
    retry: false,

    // Placeholder data pendant le loading
    placeholderData: (previousData) => previousData,
  });
}
