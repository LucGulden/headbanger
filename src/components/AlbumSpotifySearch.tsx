'use client';

import { useState } from 'react';
import AlbumCard from './AlbumCard';
import Button from './Button';
import { useSearchAlbums } from '@/hooks/useSpotifyQueries';
import { useDebouncedValue } from '@/hooks/useDebounce';
import type { SpotifyAlbumData } from '@/types/album';

interface AlbumSpotifySearchProps {
  onAlbumSelect: (album: SpotifyAlbumData) => void;
}

export default function AlbumSpotifySearch({ onAlbumSelect }: AlbumSpotifySearchProps) {
  const [query, setQuery] = useState('');

  // Debounce la query pour éviter trop de requêtes
  const debouncedQuery = useDebouncedValue(query, 500);

  // React Query hook pour la recherche Spotify
  // Cache automatique 1h, pas de requêtes dupliquées
  const {
    data: spotifyResults = [],
    isLoading,
    error,
    isFetching,
  } = useSearchAlbums(debouncedQuery);

  const hasSearched = debouncedQuery.trim().length > 0;

  return (
    <div className="w-full">
      {/* Barre de recherche */}
      <div className="mb-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-5 w-5 text-[var(--foreground-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un album ou un artiste..."
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-4 pl-12 pr-4 text-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
          {isFetching && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {`Recherchez parmi des millions d'albums sur Spotify`}
          {debouncedQuery !== query && ' (tape en cours...)'}
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error instanceof Error ? error.message : 'Une erreur est survenue'}</span>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && spotifyResults.length === 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]"></div>
              <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]"></div>
              <div className="mt-2 h-3 w-2/3 rounded bg-[var(--background-lighter)]"></div>
            </div>
          ))}
        </div>
      )}

      {/* Résultats */}
      {!isLoading && spotifyResults.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {spotifyResults.length} résultat{spotifyResults.length > 1 ? 's' : ''} trouvé
            {spotifyResults.length > 1 ? 's' : ''}
            {isFetching && ' (mise à jour...)'}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {spotifyResults.map((album) => {

              return (
                <div key={album.spotifyId} className="relative">
                  <AlbumCard
                    album={album}
                    actions={
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAlbumSelect(album);
                        }}
                        variant={'primary'}
                      >
                        {'Créer à partir de cet album'}
                      </Button>
                    }
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && hasSearched && spotifyResults.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Aucun résultat</h3>
          <p className="text-[var(--foreground-muted)]">
            {`Essayez avec un autre nom d'album ou d'artiste`}
          </p>
        </div>
      )}

      {/* État initial */}
      {!isLoading && !hasSearched && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">💿</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Recherchez votre premier album
          </h3>
          <p className="text-[var(--foreground-muted)]">
            {`Tapez le nom d'un album ou d'un artiste pour commencer`}
          </p>
        </div>
      )}
    </div>
  );
}
