'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import AlbumGrid from '@/components/AlbumGrid';
import AddAlbumModal from '@/components/AddAlbumModal';
import Button from '@/components/Button';
import {
  subscribeToUserCollection,
  removeFromCollection,
} from '@/lib/user-albums';
import type { UserAlbumWithDetails } from '@/types/collection';

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [albums, setAlbums] = useState<UserAlbumWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Subscribe aux changements real-time
  useEffect(() => {
    if (!user) return;

    console.log('[Collection] Abonnement aux changements real-time...');

    const unsubscribe = subscribeToUserCollection(
      user.uid,
      (updatedAlbums) => {
        console.log(`[Collection] Reçu ${updatedAlbums.length} albums`);
        setAlbums(updatedAlbums);
        setLoading(false);
      },
      (err) => {
        console.error('[Collection] Erreur:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('[Collection] Désabonnement');
      unsubscribe();
    };
  }, [user]);

  const handleRemove = async (albumId: string) => {
    if (!user) return;

    if (!confirm('Êtes-vous sûr de vouloir retirer cet album de votre collection ?')) {
      return;
    }

    try {
      setRemoving(albumId);
      await removeFromCollection(user.uid, albumId);
      // Le state sera automatiquement mis à jour via onSnapshot
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setRemoving(null);
    }
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
              Ma Collection
            </h1>
            <p className="text-[var(--foreground-muted)]">
              {loading
                ? 'Chargement...'
                : albums.length === 0
                ? 'Aucun album pour le moment'
                : `${albums.length} album${albums.length > 1 ? 's' : ''} dans votre collection`}
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ajouter des albums
            </span>
          </Button>
        </div>

        {/* Message d'erreur */}
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
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Grid d'albums */}
        <AlbumGrid
          albums={albums}
          type="collection"
          onRemove={handleRemove}
          loading={loading}
        />

        {/* Modal d'ajout */}
        <AddAlbumModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetType="collection"
        />
      </div>
    </div>
  );
}
