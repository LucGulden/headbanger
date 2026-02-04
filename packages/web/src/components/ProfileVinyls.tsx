import { useEffect } from 'react'
import VinylGrid from './VinylGrid'
import { useVinylsPagination } from '../hooks/useVinylsPagination'
import { useVinylStatsStore } from '../stores/vinylStatsStore'
import type { UserVinylType } from '@fillcrate/shared'
import Button from './Button'
import { Link } from 'react-router-dom'

interface ProfileVinylsProps {
  userId: string;
  type: UserVinylType;
  isOwnProfile: boolean;
  username: string;
}

export default function ProfileVinyls({
  userId,
  type,
  isOwnProfile,
  username,
}: ProfileVinylsProps) {
  const {
    vinyls,
    loading,
    loadingMore,
    hasMore,
    error,
    total,
    loadMore,
    refresh,
  } = useVinylsPagination({ userId, type })
  
  // ✨ Store Zustand pour observer les changements
  const vinylStatsStore = useVinylStatsStore()

  // ✨ Rafraîchir quand les stats changent
  useEffect(() => {
    if (isOwnProfile) {
      refresh()
    }
  }, [vinylStatsStore.stats.collectionCount, vinylStatsStore.stats.wishlistCount, isOwnProfile, refresh])


  // Empty state
  if (!loading && vinyls.length === 0) {
    const isCollection = type === 'collection'
    
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">
          {isCollection ? '📀' : '⭐'}
        </div>
        <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          {isOwnProfile
            ? isCollection
              ? 'Votre collection est vide'
              : 'Votre wishlist est vide'
            : isCollection
            ? `${username} n'a pas encore de vinyles`
            : `${username} n'a pas de wishlist`}
        </h3>
        <p className="mb-6 text-[var(--foreground-muted)]">
          {isOwnProfile
            ? `Commencez à ajouter des vinyles à votre ${isCollection ? 'collection' : 'wishlist'}`
            : `${username} n'a pas encore ajouté de vinyles`}
        </p>
        {isOwnProfile && (
          <Link to="/search">
            <Button variant="primary">
              {isCollection ? 'Ajouter à ma collection' : 'Ajouter à ma wishlist'}
            </Button>
          </Link>
        )}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          Erreur de chargement
        </h3>
        <p className="text-[var(--foreground-muted)]">
          {error.message}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header avec compteur */}
      {total > 0 && (
        <div className="mb-6">
          <p className="text-sm text-[var(--foreground-muted)]">
            {total} {total === 1 ? 'vinyle' : 'vinyles'}
          </p>
        </div>
      )}

      {/* Grille de vinyles */}
      <VinylGrid
        vinyls={vinyls}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        total={total}
        type={type}
        onLoadMore={loadMore}
        onRefresh={refresh}
      />
    </div>
  )
}