import { useRef, useEffect } from 'react'
import { useVinylsPagination } from '../hooks/useVinylsPagination'
import ProfileVinylCard from './ProfileVinylCard'
import { Link } from 'react-router-dom'
import type { UserVinylType } from '@headbanger/shared'

interface ProfileVinylsProps {
  userId: string
  type: UserVinylType
  isOwnProfile: boolean
  username: string
}

export default function ProfileVinyls({
  userId,
  type,
  isOwnProfile,
  username,
}: ProfileVinylsProps) {
  const { vinyls, loading, loadingMore, hasMore, error, loadMore } = useVinylsPagination({
    userId,
    type,
  })
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isCollection = type === 'collection'

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasMore || loadingMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [hasMore, loadingMore, loadMore])

  // Loading skeleton
  if (loading && vinyls.length === 0) {
    return (
      <div className="vinyl-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ aspectRatio: '1', background: 'var(--surface-2)' }} />
            <div style={{ padding: '0.8rem 0.9rem' }}>
              <div
                style={{
                  height: '0.88rem',
                  background: 'var(--surface-3)',
                  borderRadius: 4,
                  marginBottom: '0.4rem',
                }}
              />
              <div
                style={{
                  height: '0.76rem',
                  background: 'var(--surface-3)',
                  borderRadius: 4,
                  width: '60%',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="feed-empty">
        <h2 className="feed-empty__title">Erreur de chargement</h2>
        <p className="feed-empty__desc">{error.message}</p>
      </div>
    )
  }

  // Empty
  if (!loading && vinyls.length === 0) {
    return (
      <div className="feed-empty">
        <h2 className="feed-empty__title">
          {isOwnProfile
            ? isCollection
              ? 'Votre collection est vide'
              : 'Votre wishlist est vide'
            : isCollection
              ? `${username} n'a pas encore de vinyles`
              : `${username} n'a pas de wishlist`}
        </h2>
        <p className="feed-empty__desc">
          {isOwnProfile
            ? `Commencez à ajouter des vinyles à votre ${isCollection ? 'collection' : 'wishlist'}`
            : `${username} n'a pas encore ajouté de vinyles`}
        </p>
        {isOwnProfile && (
          <Link to="/search" className="btn btn--primary">
            {isCollection ? 'Ajouter à ma collection' : 'Ajouter à ma wishlist'}
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="vinyl-grid">
        {vinyls.map((vinyl, i) => (
          <ProfileVinylCard key={vinyl.id} vinyl={vinyl.vinyl} type={type} index={i} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}
        >
          {loadingMore && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Chargement...
            </div>
          )}
        </div>
      )}
    </>
  )
}
