import { useState, useEffect } from 'react';
import { getVinylsByAlbum, hasVinyl } from '../lib/vinyls';
import type { Album, Vinyl } from '../types/vinyl';
import VinylImage from './VinylImage';

interface VinylSelectionProps {
  album: Album;
  userId: string;
  onVinylSelect: (vinyl: Vinyl) => void;
}

interface VinylStatus {
  inCollection: boolean;
  inWishlist: boolean;
}

export default function VinylSelection({ album, userId, onVinylSelect }: VinylSelectionProps) {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [statuses, setStatuses] = useState<Map<string, VinylStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVinyls = async () => {
      setLoading(true);
      setError(null);

      try {
        const vinylResults = await getVinylsByAlbum(album.id);
        setVinyls(vinylResults);

        // Vérifier le statut de chaque vinyle
        const statusMap = new Map<string, VinylStatus>();
        await Promise.all(
          vinylResults.map(async (vinyl) => {
            try {
              const [inCol, inWish] = await Promise.all([
                hasVinyl(userId, vinyl.id, 'collection'),
                hasVinyl(userId, vinyl.id, 'wishlist'),
              ]);
              statusMap.set(vinyl.id, {
                inCollection: inCol,
                inWishlist: inWish,
              });
            } catch (err) {
              console.error('Erreur statut:', err);
            }
          })
        );
        setStatuses(statusMap);
      } catch (err) {
        console.error('Erreur chargement vinyles:', err);
        setError('Erreur lors du chargement des pressages');
      } finally {
        setLoading(false);
      }
    };

    loadVinyls();
  }, [album.id, userId]);

  return (
    <div className="w-full">
      {/* Album header */}
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
          <VinylImage
            src={album.cover_url || ''}
            alt={`${album.title} par ${album.artist}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-[var(--foreground)]">{album.title}</h3>
          <p className="text-sm text-[var(--foreground-muted)]">{album.artist}</p>
        </div>
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
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
              <div className="h-6 w-3/4 rounded bg-[var(--background)]"></div>
              <div className="mt-2 h-4 w-1/2 rounded bg-[var(--background)]"></div>
            </div>
          ))}
        </div>
      )}

      {/* No vinyls */}
      {!loading && vinyls.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">📀</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun pressage disponible
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Aucun pressage vinyle disponible pour cet album
          </p>
        </div>
      )}

      {/* Vinyls list */}
      {!loading && vinyls.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {vinyls.length} pressage{vinyls.length > 1 ? 's' : ''} disponible{vinyls.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {vinyls.map((vinyl) => {
              const status = statuses.get(vinyl.id);
              const inCollection = status?.inCollection || false;
              const inWishlist = status?.inWishlist || false;

              return (
                <button
                  key={vinyl.id}
                  onClick={() => onVinylSelect(vinyl)}
                  className="group relative text-left transition-transform hover:scale-105"
                >
                  {/* Badges en haut */}
                  <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                    {inCollection && (
                      <div className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Collection</span>
                      </div>
                    )}
                    {inWishlist && (
                      <div className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Wishlist</span>
                      </div>
                    )}
                  </div>

                  {/* Cover */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)]">
                    <VinylImage
                      src={vinyl.cover_url || album.cover_url || ''}
                      alt={`${vinyl.title} par ${vinyl.artist}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>

                  {/* Info */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {vinyl.year && (
                        <span className="inline-block rounded bg-[var(--primary)]/20 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                          {vinyl.year}
                        </span>
                      )}
                      {vinyl.country && (
                        <span className="inline-block rounded bg-[var(--background-lighter)] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
                          {vinyl.country}
                        </span>
                      )}
                    </div>
                    {vinyl.format && (
                      <p className="text-xs text-[var(--foreground-muted)] truncate">
                        {vinyl.format}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}