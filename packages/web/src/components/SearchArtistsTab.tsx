import { useRef, useEffect } from 'react'
import { useArtistSearch } from '../hooks/useArtistSearch'
import ArtistCard from './ArtistCard'

interface SearchArtistsTabProps {
  query: string
  onCountChange: (count: number) => void
}

export default function SearchArtistsTab({ query, onCountChange }: SearchArtistsTabProps) {
  const { artists, loading, loadingMore, hasMore, error, loadMore } = useArtistSearch({ query })
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const hasSearched = query.trim().length > 0

  useEffect(() => {
    if (!loading) onCountChange?.(artists.length)
  }, [artists.length, loading, onCountChange])

  // Infinite scroll avec IntersectionObserver
  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  return (
    <div className="w-full">
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
      {loading && artists.length === 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]" />
              <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]" />
            </div>
          ))}
        </div>
      )}

      {/* Résultats */}
      {!loading && artists.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {artists.length}
            {hasMore ? '+' : ''} résultat{artists.length > 1 ? 's' : ''} trouvé
            {artists.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>

          {/* Trigger pour l'infinite scroll */}
          {hasMore && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                  <span>Chargement...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state - Recherche effectuée mais aucun résultat */}
      {!loading && hasSearched && artists.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🎤</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun artiste trouvé
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Aucun artiste trouvé pour "{query}". Essayez un autre nom.
          </p>
        </div>
      )}
    </div>
  )
}
