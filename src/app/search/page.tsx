'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import AlbumSearch from '@/components/AlbumSearch';
import type { AlbumSearchResult } from '@/types/album';

export default function SearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirection si non authentifié
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Affichage du loader pendant la vérification
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  // Ne rien afficher si pas de user (redirection en cours)
  if (!user) {
    return null;
  }

  const handleAlbumSelect = (album: AlbumSearchResult) => {
    console.log('Album sélectionné:', {
      title: album.title,
      artist: album.artist,
      spotifyId: album.spotifyId,
      firestoreId: album.firestoreId || 'Non caché',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
            Rechercher des albums
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Explorez des millions d'albums sur Spotify et ajoutez-les à votre collection
          </p>
        </div>

        {/* Composant de recherche */}
        <AlbumSearch onAlbumSelect={handleAlbumSelect} />
      </div>
    </div>
  );
}
