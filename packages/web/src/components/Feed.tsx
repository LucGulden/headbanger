import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PostCard from './PostCard'
import { useFeedPagination } from '../hooks/useFeedPagination'
import { useAuth } from '../hooks/useAuth'
import { useAnimFade } from '../hooks/useAnimFade'

interface FeedProps {
  userId?: string
  profileFeed?: boolean
}

type FilterType = 'all' | 'collection_add' | 'wishlist_add'

export default function Feed({ userId, profileFeed = false }: FeedProps) {
  const { user: currentUser } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')

  const { posts, loading, loadingMore, hasMore, error, refreshing, loadMore, refresh } =
    useFeedPagination(userId, profileFeed)

  const observerTarget = useRef<HTMLDivElement>(null)
  useAnimFade([posts.length > 0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 1.0 },
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  const [pullStartY, setPullStartY] = useState(0)
  const [pullCurrentY, setPullCurrentY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) {
      setIsPulling(false)
      return
    }
    const d = e.touches[0].clientY - pullStartY
    if (d > 0 && d < 150) setPullCurrentY(d)
  }

  const handleTouchEnd = () => {
    if (isPulling && pullCurrentY > 80) refresh()
    setIsPulling(false)
    setPullStartY(0)
    setPullCurrentY(0)
  }

  const filteredPosts = filter === 'all' ? posts : posts.filter((p) => p.type === filter)

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="feed-filters">
          <button className="feed-filter is-active">All</button>
          <button className="feed-filter">
            <span className="feed-filter__dot feed-filter__dot--collection" />
            Collection
          </button>
          <button className="feed-filter">
            <span className="feed-filter__dot feed-filter__dot--wishlist" />
            Wishlist
          </button>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="feed-post" style={{ marginTop: i > 1 ? '1rem' : 0 }}>
            <div className="feed-post__header">
              <div className="feed-post__avatar" style={{ background: 'var(--surface-3)' }} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: '0.85rem',
                    background: 'var(--surface-3)',
                    borderRadius: 4,
                    width: '30%',
                    marginBottom: '0.4rem',
                  }}
                />
                <div
                  style={{
                    height: '0.75rem',
                    background: 'var(--surface-3)',
                    borderRadius: 4,
                    width: '60%',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                height: '88px',
                background: 'var(--surface-3)',
                borderRadius: '12px',
                margin: '1rem 0',
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="feed-empty">
        <h2 className="feed-empty__title">Something went wrong</h2>
        <p className="feed-empty__desc">{error.message}</p>
        <button className="btn btn--primary" onClick={refresh}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull-to-refresh indicator */}
      {(isPulling || refreshing) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '1rem 0',
            transform: `translateY(${isPulling ? pullCurrentY / 2 : 0}px)`,
            opacity: isPulling ? Math.min(pullCurrentY / 80, 1) : 1,
            transition: refreshing ? 'none' : undefined,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '3px solid var(--accent)',
              borderTopColor: 'transparent',
              animation: refreshing ? 'vinyl-spin 0.8s linear infinite' : undefined,
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="feed-filters anim-fade" data-delay="0">
        <button
          className={`feed-filter ${filter === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          All
        </button>
        <button
          className={`feed-filter ${filter === 'collection_add' ? 'is-active' : ''}`}
          onClick={() => setFilter('collection_add')}
          aria-pressed={filter === 'collection_add'}
        >
          <span className="feed-filter__dot feed-filter__dot--collection" />
          Collection
        </button>
        <button
          className={`feed-filter ${filter === 'wishlist_add' ? 'is-active' : ''}`}
          onClick={() => setFilter('wishlist_add')}
          aria-pressed={filter === 'wishlist_add'}
        >
          <span className="feed-filter__dot feed-filter__dot--wishlist" />
          Wishlist
        </button>
      </div>

      {/* Empty state */}
      {filteredPosts.length === 0 && (
        <div className="feed-empty" id="feedEmpty">
          <div className="feed-empty__disc">
            <div className="feed-empty__disc-groove" />
            <div className="feed-empty__disc-groove feed-empty__disc-groove--2" />
            <div className="feed-empty__disc-label" />
          </div>
          <h2 className="feed-empty__title">
            {profileFeed ? 'No activity yet' : 'Your feed is quiet'}
          </h2>
          <p className="feed-empty__desc">
            {profileFeed
              ? 'This user has no visible activity yet.'
              : 'Follow more collectors to fill your feed with the records that matter.'}
          </p>
          {!profileFeed && (
            <Link to="/search" className="btn btn--primary">
              Discover collectors
              <svg
                className="btn__arrow"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <line x1="1" y1="8" x2="13" y2="8" />
                <polyline points="9,4 13,8 9,12" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* Posts */}
      <div className="feed-posts" id="feedPosts">
        {filteredPosts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUser?.id}
            priority={index === 0}
          />
        ))}
      </div>

      {/* Infinite scroll target */}
      {hasMore && (
        <div ref={observerTarget} className="feed-load-more">
          {loadingMore && (
            <button className="feed-load-more__btn is-loading" disabled>
              <span className="feed-load-more__text">Load more</span>
              <span className="feed-load-more__loader" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          )}
        </div>
      )}

      {!hasMore && filteredPosts.length > 0 && (
        <div className="feed-load-more">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You're all caught up</p>
        </div>
      )}
    </div>
  )
}
