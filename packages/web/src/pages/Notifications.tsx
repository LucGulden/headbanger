import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { followUser, unfollowUser, isFollowing } from '../lib/api/follows'
import { getHueFromString } from '../utils/hue'
import { useAnimFade } from '../hooks/useAnimFade'
import type { Notification } from '@headbanger/shared'
import '../styles/notifications.css'
import { useNotificationsStore } from '../stores/notificationsStore'

type FilterType = 'all' | 'follows' | 'likes' | 'comments'

function getNotifType(notif: Notification): 'follow' | 'like' | 'comment' {
  if (notif.type === 'new_follower') return 'follow'
  if (notif.type === 'post_like') return 'like'
  return 'comment'
}

function formatTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)} days ago`
}

function getDateGroup(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff <= 7) return 'This week'
  return 'Earlier'
}

// ---- NotifItem ----
function NotifItem({ notif, index }: { notif: Notification; index: number }) {
  const type = getNotifType(notif)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const coverHue = getHueFromString((notif as any).vinylId ?? (notif as any).albumId ?? 'default')

  // Check follow status si type follow
  useEffect(() => {
    if (type !== 'follow' || !notif.actor.uid) return
    isFollowing(notif.actor.uid)
      .then(setFollowing)
      .catch(() => {})
  }, [type, notif.actor])

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notif.actor.uid) return
    try {
      setFollowLoading(true)
      if (following) {
        await unfollowUser(notif.actor.uid)
        setFollowing(false)
      } else {
        await followUser(notif.actor.uid)
        setFollowing(true)
      }
    } catch {
      // TODO
    } finally {
      setFollowLoading(false)
    }
  }

  const actorName = (notif as any).actorName ?? (notif as any).actor?.username ?? 'Someone'
  const actorUsername = (notif as any).actorUsername ?? (notif as any).actor?.username ?? ''
  const vinylTitle = (notif as any).vinylTitle ?? (notif as any).vinyl?.title ?? ''
  const comment = (notif as any).comment ?? (notif as any).content ?? ''

  return (
    <article
      className={`notif-item ${notif.read ? 'is-read' : 'is-unread'}`}
      data-id={notif.id}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Type icon */}
      <div className={`notif-item__icon notif-item__icon--${type}`}>
        {type === 'follow' && (
          <svg
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="9" cy="7" r="3.5" />
            <path d="M2 16c0-3.5 3-6 7-6s7 2.5 7 6" />
          </svg>
        )}
        {type === 'like' && (
          <svg
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M2.5 4.5a3.5 3.5 0 015 0L9 6l1.5-1.5a3.5 3.5 0 115 5L9 16l-6.5-6.5a3.5 3.5 0 010-5z" />
          </svg>
        )}
        {type === 'comment' && (
          <svg
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M2 3h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3v-3H2a1 1 0 01-1-1V4a1 1 0 011-1z" />
          </svg>
        )}
      </div>

      {/* Body */}
      <div className="notif-item__body">
        <p className="notif-item__text">
          {actorUsername ? (
            <Link to={`/profile/${actorUsername}`} onClick={(e) => e.stopPropagation()}>
              <strong>{actorName}</strong>
            </Link>
          ) : (
            <strong>{actorName}</strong>
          )}
          {type === 'follow' && ' started following you'}
          {type === 'like' && (
            <>
              {' '}
              liked your post about <em>{vinylTitle}</em>
            </>
          )}
          {type === 'comment' && (
            <>
              {' '}
              commented on your post about <em>{vinylTitle}</em>
            </>
          )}
        </p>
        <span className="notif-item__time">{formatTime(notif.createdAt)}</span>
        {type === 'comment' && comment && <div className="notif-item__comment">"{comment}"</div>}
      </div>

      {/* Right slot */}
      {type === 'follow' && (
        <div className="notif-item__action">
          <button
            className={`notif-follow-btn ${following ? 'is-following' : ''}`}
            onClick={handleFollow}
            disabled={followLoading}
          >
            {following ? (
              <>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="3,8 7,12 13,4" />
                </svg>
                <span>Following</span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <line x1="8" y1="3" x2="8" y2="13" />
                  <line x1="3" y1="8" x2="13" y2="8" />
                </svg>
                <span>Follow</span>
              </>
            )}
          </button>
        </div>
      )}
      {(type === 'like' || type === 'comment') && (
        <div
          className="notif-item__vinyl"
          style={{ '--cover-hue': coverHue } as React.CSSProperties}
        >
          <div className="notif-item__vinyl-grooves" />
          {/* TODO: image vinyle si dispo */}
        </div>
      )}
    </article>
  )
}

// ---- Page ----
export default function NotificationsPage() {
  const { notifications, loading, loadingMore, hasMore, error, loadMore, handleMarkAllAsRead } =
    useNotifications()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [localNotifs, setLocalNotifs] = useState<Notification[]>([])
  const { reset } = useNotificationsStore()

  const filtersRef = useRef<HTMLDivElement>(null)

  useAnimFade([!loading])

  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setLocalNotifs(notifications)
  }, [notifications])

  useEffect(() => {
    if (loading) return

    // Reset le compteur dans le store (Navigation)
    reset()

    // Marquer en BDD seulement s'il y a des notifications non lues
    if (unreadCount > 0) {
      handleMarkAllAsRead()
    }
  }, [loading])

  const unreadCount = localNotifs.filter((n) => !n.read).length
  const filteredNotifs = localNotifs.filter((n) => {
    const type = getNotifType(n)
    if (activeFilter === 'all') return true
    if (activeFilter === 'follows') return type === 'follow'
    if (activeFilter === 'likes') return type === 'like'
    if (activeFilter === 'comments') return type === 'comment'
    return true
  })

  const countByType = (type: 'follow' | 'like' | 'comment') =>
    localNotifs.filter((n) => getNotifType(n) === type).length

  // Grouper par date
  const grouped = filteredNotifs.reduce<Record<string, Notification[]>>((acc, n) => {
    const group = getDateGroup(n.createdAt)
    if (!acc[group]) acc[group] = []
    acc[group].push(n)
    return acc
  }, {})

  const DATE_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier']
  const sortedGroups = DATE_ORDER.filter((g) => grouped[g])

  // Indicator
  const positionIndicator = useCallback((btn: HTMLButtonElement) => {
    if (!filtersRef.current) return
    const parentRect = filtersRef.current.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setIndicatorStyle({ left: btnRect.left - parentRect.left, width: btnRect.width })
  }, [])

  useEffect(() => {
    if (!filtersRef.current) return
    const activeBtn = filtersRef.current.querySelector<HTMLButtonElement>('.notif-filter.is-active')
    if (activeBtn) positionIndicator(activeBtn)
  }, [activeFilter, loading, positionIndicator])

  useEffect(() => {
    const handleResize = () => {
      const activeBtn =
        filtersRef.current?.querySelector<HTMLButtonElement>('.notif-filter.is-active')
      if (activeBtn) positionIndicator(activeBtn)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [positionIndicator])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const filters: FilterType[] = ['all', 'follows', 'likes', 'comments']
    const currentIndex = filters.indexOf(activeFilter)
    let nextIndex = -1
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % filters.length
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + filters.length) % filters.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = filters.length - 1
    if (nextIndex >= 0) {
      e.preventDefault()
      const btns = filtersRef.current?.querySelectorAll<HTMLButtonElement>('.notif-filter')
      if (btns?.[nextIndex]) {
        btns[nextIndex].focus()
        setActiveFilter(filters[nextIndex])
        positionIndicator(btns[nextIndex])
      }
    }
  }

  return (
    <main className="notif-page">
      {/* HEADER */}
      <div className="notif-header">
        <div className="notif-header__bg" aria-hidden="true">
          <div className="notif-header__glow notif-header__glow--1" />
          <div className="notif-header__glow notif-header__glow--2" />
        </div>
        <div className="notif-header__inner">
          <div className="notif-header__top anim-fade" data-delay="0">
            <h1 className="notif-header__title">Notifications</h1>
            {unreadCount > 0 && <span className="notif-header__badge">{unreadCount} new</span>}
          </div>
          <p className="notif-header__subtitle anim-fade" data-delay="1">
            Follows, likes, and comments on your collection.
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="notif-filters-wrap">
        <div
          className="notif-filters"
          ref={filtersRef}
          role="tablist"
          aria-label="Notification filters"
          onKeyDown={handleKeyDown}
        >
          {(
            [
              { id: 'all', label: 'All', count: localNotifs.length, icon: null },
              {
                id: 'follows',
                label: 'Follows',
                count: countByType('follow'),
                icon: (
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="7" r="3.5" />
                    <path d="M2 16c0-3.5 3-6 7-6s7 2.5 7 6" />
                  </svg>
                ),
              },
              {
                id: 'likes',
                label: 'Likes',
                count: countByType('like'),
                icon: (
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <path d="M2.5 4.5a3.5 3.5 0 015 0L9 6l1.5-1.5a3.5 3.5 0 115 5L9 16l-6.5-6.5a3.5 3.5 0 010-5z" />
                  </svg>
                ),
              },
              {
                id: 'comments',
                label: 'Comments',
                count: countByType('comment'),
                icon: (
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <path d="M2 3h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3v-3H2a1 1 0 01-1-1V4a1 1 0 011-1z" />
                  </svg>
                ),
              },
            ] as { id: FilterType; label: string; count: number; icon: React.ReactNode }[]
          ).map((f) => (
            <button
              key={f.id}
              className={`notif-filter ${activeFilter === f.id ? 'is-active' : ''}`}
              aria-pressed={activeFilter === f.id}
              onClick={(e) => {
                setActiveFilter(f.id)
                positionIndicator(e.currentTarget)
              }}
            >
              {f.icon}
              <span className="notif-filter__label">{f.label}</span>
              <span className="notif-filter__count">{f.count}</span>
            </button>
          ))}
          <div
            className="notif-filter__indicator"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="notif-list">
          <div className="notif-list__inner">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: 'var(--space-sm)',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: '0.88rem',
                      background: 'var(--surface-2)',
                      borderRadius: 4,
                      width: '60%',
                      marginBottom: '0.4rem',
                    }}
                  />
                  <div
                    style={{
                      height: '0.72rem',
                      background: 'var(--surface-2)',
                      borderRadius: 4,
                      width: '30%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="notif-empty">
          <div className="notif-empty__inner">
            <h2 className="notif-empty__title">Erreur de chargement</h2>
            <p className="notif-empty__desc">
              {error instanceof Error ? error.message : 'Une erreur est survenue'}
            </p>
          </div>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && filteredNotifs.length > 0 && (
        <div className="notif-list">
          <div className="notif-list__inner">
            {(() => {
              let globalIndex = 0
              return sortedGroups.map((group) => (
                <div key={group}>
                  <div className="notif-date">{group}</div>
                  {grouped[group].map((notif) => (
                    <NotifItem key={notif.id} notif={notif} index={globalIndex++} />
                  ))}
                </div>
              ))
            })()}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div
              ref={loadMoreRef}
              style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-md)' }}
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
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && filteredNotifs.length === 0 && (
        <div className="notif-empty">
          <div className="notif-empty__inner">
            <div className="notif-empty__icon-wrap">
              <svg
                className="notif-empty__icon"
                viewBox="0 0 56 56"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <path d="M28 6c-7.7 0-14 6.3-14 14v8l-4 6h36l-4-6v-8c0-7.7-6.3-14-14-14z" />
                <path d="M22 34c0 3.3 2.7 6 6 6s6-2.7 6-6" opacity="0.5" />
                <line x1="28" y1="2" x2="28" y2="6" opacity="0.3" />
              </svg>
            </div>
            <h2 className="notif-empty__title">You're all caught up</h2>
            <p className="notif-empty__desc">
              No notifications in this category yet. Keep spinning those records and they'll come.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
