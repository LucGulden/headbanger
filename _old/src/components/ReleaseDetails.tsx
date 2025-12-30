'use client';

import type { Release } from '@/types/release';
import Button from './Button';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { isInCollection, isInWishlist } from '@/lib/user-releases';
import { CollectionType } from '@/types/collection';
import ImageOptimized from './ImageOptimized';

interface ReleaseDetailsProps {
  release: Release;
  targetType: CollectionType;
  onConfirm: () => void;
}

export default function ReleaseDetails({
  release,
  targetType,
  onConfirm,
}: ReleaseDetailsProps) {
  const { user } = useAuth();
  const [inCollection, setInCollection] = useState<boolean>(false);
  const [inWishlist, setInWishlist] = useState<boolean>(false);
  const [displayButton, setDisplayButton] = useState<boolean>(false);
  
  // Vérifie si l'année de sortie diffère de l'année de l'album original
  const isReissue = release.releaseYear !== release.year;

  // Recherche dans Firestore et vérification des statuts

  
  useEffect(() => {
    let isMounted = true; // Flag pour savoir si le composant est encore monté

    const setStatus = async () => {
      // Vérifier le statut (collection/wishlist) si user connecté
      if (user) {
        const [inCol, inWish] = await Promise.all([
          isInCollection(user.uid, release.id),
          isInWishlist(user.uid, release.id),
        ]);
        if (isMounted) { // Vérifie avant de mettre à jour
          setInCollection(inCol);
          setInWishlist(inWish);
          setDisplayButton(true);
        }
      }
    }

    setStatus();
      
    return () => {
      isMounted = false; // Cleanup quand le composant se démonte
    };
  }, [user, release.id]);

  const displayAddButton = !inCollection && !inWishlist;

  return (
    <div className="space-y-6">
      {/* Cover et infos principales */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] md:w-[300px]">
          <ImageOptimized
            src={release.coverUrl}
            alt={`${release.title} - ${release.artist}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>

        {/* Infos principales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">
              {release.title}
            </h3>
            <p className="mt-1 text-lg font-medium text-[var(--foreground-muted)]">
              {release.artist}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {isReissue ? (
                <>
                  Album original : {release.year} • Réédition : {release.releaseYear}
                </>
              ) : (
                release.year
              )}
            </p>
          </div>

          {/* Conteneur pour les badges */}
          <div className="flex flex-wrap gap-2">
            {/* Badge de collection (optionnel) */}
            {inCollection && (
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>En collection</span>
              </div>
            )}

            {/* Badge de wishlist (optionnel) */}
            {inWishlist && (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>En wishlist</span>
              </div>
            )}

            {/* Badge de réédition (optionnel) */}
            {isReissue && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Réédition
              </div>
            )}
          </div>

          {/* Détails de l'édition */}
          <div className="space-y-3 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              {`Détails de l'édition`}
            </h4>
            <div className="space-y-2">
              <DetailRow label="Label" value={release.label} />
              <DetailRow label="Numéro de catalogue" value={release.catalogNumber} />
              <DetailRow label="Pays" value={release.country} />
              <DetailRow label="Format" value={release.format} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {displayButton && displayAddButton &&
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--background-lighter)] pt-6 sm:flex-row sm:justify-end">
          <Button
            onClick={onConfirm}
            variant="primary"
            className="w-full sm:w-auto"
          >
            Ajouter cette édition
          </Button>
        </div>
      }
    </div>
  );
}

// Composant helper pour les lignes de détails
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--foreground-muted)]">
        {label}
      </span>
      <span className="text-sm font-medium text-[var(--foreground)] text-right">
        {value}
      </span>
    </div>
  );
}