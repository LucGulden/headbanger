import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getArtistById } from '../lib/api/artists'
import type { Artist } from '@headbanger/shared'
import VinylCover from '../components/VinylCover'
import { getHueFromString } from '../utils/hue'
import { useAnimFade } from '../hooks/useAnimFade'
import '../styles/artist.css'

type TabId = 'discography' | 'about'

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('discography')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const tabsRef = useRef<HTMLDivElement>(null)

  useAnimFade([!!artist])

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getArtistById(id)
        if (!data) {
          setError('Artist not found')
          return
        }
        setArtist(data)
      } catch {
        setError('Error loading artist')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const positionIndicator = useCallback((btn: HTMLButtonElement) => {
    if (!tabsRef.current) return
    const parentRect = tabsRef.current.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setIndicatorStyle({ left: btnRect.left - parentRect.left, width: btnRect.width })
  }, [])

  useEffect(() => {
    if (!tabsRef.current) return
    const activeBtn = tabsRef.current.querySelector<HTMLButtonElement>('.artist__tab.is-active')
    if (activeBtn) positionIndicator(activeBtn)
  }, [activeTab, artist, positionIndicator])

  useEffect(() => {
    const handleResize = () => {
      if (!tabsRef.current) return
      const activeBtn = tabsRef.current.querySelector<HTMLButtonElement>('.artist__tab.is-active')
      if (activeBtn) positionIndicator(activeBtn)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [positionIndicator])

  const switchTab = useCallback(
    (tab: TabId, btn: HTMLButtonElement) => {
      setActiveTab(tab)
      positionIndicator(btn)
      // Re-trigger anim-fade pour les éléments du panel qui viennent d'apparaître
      setTimeout(() => {
        document
          .querySelectorAll('.artist__panel.is-active .anim-fade:not(.is-visible)')
          .forEach((el, i) => {
            ;(el as HTMLElement).style.transitionDelay = `${i * 0.06}s`
            requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')))
          })
      }, 0)
    },
    [positionIndicator],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs: TabId[] = ['discography', 'about']
    const currentIndex = tabs.indexOf(activeTab)
    let nextIndex = -1
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex >= 0) {
      e.preventDefault()
      const btns = tabsRef.current?.querySelectorAll<HTMLButtonElement>('.artist__tab')
      if (btns?.[nextIndex]) {
        btns[nextIndex].focus()
        switchTab(tabs[nextIndex], btns[nextIndex])
      }
    }
  }

  if (loading) {
    return (
      <main className="artist">
        <div className="artist__cover">
          <div className="artist__cover-bg" />
        </div>
        <div className="artist__header">
          <div className="artist__header-inner">
            <div className="artist__avatar-wrap">
              <div className="artist__avatar" style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="artist__info">
              <div
                style={{
                  height: '2rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '200px',
                }}
              />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !artist) {
    return (
      <main className="artist">
        <div
          className="feed-empty"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2 className="feed-empty__title">{error || 'Artist not found'}</h2>
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>
            ← Go back
          </button>
        </div>
      </main>
    )
  }

  const avatarHue = getHueFromString(artist.id)
  const initials = artist.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="artist">
      {/* COVER BANNER */}
      <div className="artist__cover">
        <div className="artist__cover-bg" aria-hidden="true">
          <div className="artist__cover-grain" />
          <div className="artist__cover-glow artist__cover-glow--1" />
          <div className="artist__cover-glow artist__cover-glow--2" />
          <div className="artist__cover-grooves" />
        </div>
      </div>

      {/* ARTIST HEADER */}
      <div className="artist__header">
        <div className="artist__header-inner">
          {/* Avatar */}
          <div className="artist__avatar-wrap anim-fade" data-delay="0">
            <div className="artist__avatar">
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg
                  className="artist__avatar-placeholder"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect width="120" height="120" rx="60" fill="#1e1e26" />
                  <circle cx="60" cy="46" r="20" fill="#2a2a35" />
                  <ellipse cx="60" cy="95" rx="32" ry="22" fill="#2a2a35" />
                  <text
                    x="60"
                    y="56"
                    textAnchor="middle"
                    fill="hsl(var(--accent-h, 43), 65%, 55%)"
                    fontFamily="'Clash Display', sans-serif"
                    fontWeight="600"
                    fontSize="24"
                  >
                    {initials}
                  </text>
                </svg>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="artist__info anim-fade" data-delay="1">
            <div className="artist__name-row">
              <h1 className="artist__name">{artist.name}</h1>
            </div>

            {/* TODO_genres: ajouter au type Artist */}
            {(artist as any).genres && (
              <div className="artist__genres">
                {(artist as any).genres.map((g: string) => (
                  <span key={g} className="artist__genre-tag">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* TODO_bio: ajouter au type Artist */}
            {(artist as any).bio && <p className="artist__bio">{(artist as any).bio}</p>}
          </div>

          {/* Stats */}
          <div className="artist__stats anim-fade" data-delay="2">
            <div className="artist__stat">
              <span className="artist__stat-number">{artist.albums.length}</span>
              <span className="artist__stat-label">Albums</span>
            </div>
            {/* TODO_collectionCount: ajouter au type Artist */}
            {(artist as any).collectionCount !== undefined && (
              <>
                <div className="artist__stat-divider" />
                <div className="artist__stat">
                  <span className="artist__stat-number">
                    {(artist as any).collectionCount.toLocaleString()}
                  </span>
                  <span className="artist__stat-label">In Collections</span>
                </div>
              </>
            )}
            {/* TODO_followerCount: ajouter au type Artist */}
            {(artist as any).followerCount !== undefined && (
              <>
                <div className="artist__stat-divider" />
                <div className="artist__stat">
                  <span className="artist__stat-number">
                    {(artist as any).followerCount.toLocaleString()}
                  </span>
                  <span className="artist__stat-label">Followers</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="artist__tabs-wrap">
        <div
          className="artist__tabs"
          ref={tabsRef}
          role="tablist"
          aria-label="Artist sections"
          onKeyDown={handleKeyDown}
        >
          <button
            className={`artist__tab ${activeTab === 'discography' ? 'is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'discography'}
            aria-controls="panel-discography"
            id="tab-discography"
            onClick={(e) => switchTab('discography', e.currentTarget)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="8" />
              <circle cx="10" cy="10" r="3" />
              <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
            </svg>
            Discography
            <span className="artist__tab-count">{artist.albums.length}</span>
          </button>

          {/* TODO_bio/members: afficher About seulement si des données existent */}
          <button
            className={`artist__tab ${activeTab === 'about' ? 'is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'about'}
            aria-controls="panel-about"
            id="tab-about"
            onClick={(e) => switchTab('about', e.currentTarget)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="8" />
              <line x1="10" y1="7" x2="10" y2="11" />
              <circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none" />
            </svg>
            About
          </button>

          <div
            className="artist__tab-indicator"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>
      </div>

      {/* TAB PANELS */}
      <div className="artist__content">
        {/* DISCOGRAPHY */}
        <div
          className={`artist__panel ${activeTab === 'discography' ? 'is-active' : ''}`}
          role="tabpanel"
          id="panel-discography"
          aria-labelledby="tab-discography"
          hidden={activeTab !== 'discography'}
        >
          <div className="artist__panel-inner">
            {artist.albums.length === 0 ? (
              <div className="feed-empty">
                <h2 className="feed-empty__title">No albums yet</h2>
              </div>
            ) : (
              <div className="artist-album-grid">
                {artist.albums.map((album, i) => {
                  const hue = getHueFromString(album.id)
                  return (
                    <Link
                      key={album.id}
                      to={`/album/${album.id}`}
                      className="artist-album-card anim-fade"
                      data-delay={i}
                    >
                      <div
                        className="artist-album-card__cover"
                        style={{ '--cover-hue': hue } as React.CSSProperties}
                      >
                        {album.coverUrl ? (
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div className="artist-album-card__cover-grooves" />
                        )}
                        <div className="artist-album-card__overlay">
                          {album.year && (
                            <span className="artist-album-card__year-badge">{album.year}</span>
                          )}
                        </div>
                      </div>
                      <div className="artist-album-card__info">
                        <span className="artist-album-card__title">{album.title}</span>
                        <span className="artist-album-card__artists">
                          {album.artists.map((a) => a.name).join(' · ')}
                        </span>
                        <div className="artist-album-card__meta">
                          {album.year && (
                            <span className="artist-album-card__year">{album.year}</span>
                          )}
                          {/* TODO CORRIGER CA ET LE REACTIVER */}
                          {/* {album.vinyls.length > 0 && (
                            <span className="artist-album-card__releases">
                              <svg
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                aria-hidden="true"
                              >
                                <circle cx="6" cy="6" r="4.5" />
                                <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
                              </svg>
                              {album.vinyls.length}{' '}
                              {album.vinyls.length > 1 ? 'releases' : 'release'}
                            </span>
                          )} */}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ABOUT */}
        <div
          className={`artist__panel ${activeTab === 'about' ? 'is-active' : ''}`}
          role="tabpanel"
          id="panel-about"
          aria-labelledby="tab-about"
          hidden={activeTab !== 'about'}
        >
          <div className="artist__panel-inner">
            <div className="artist-about">
              {/* TODO_members: ajouter au type Artist — structure { name, role }[] */}
              {(artist as any).members && (
                <div className="artist-about__section anim-fade">
                  <h3 className="artist-about__heading">Members</h3>
                  <div className="artist-about__members">
                    {(artist as any).members.map((member: { name: string; role: string }) => {
                      const memberInitials = member.name
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                      const memberHue = getHueFromString(member.name)
                      return (
                        <div key={member.name} className="artist-about__member">
                          <div
                            className="artist-about__member-avatar"
                            style={{ '--avatar-hue': memberHue } as React.CSSProperties}
                          >
                            {memberInitials}
                          </div>
                          <div className="artist-about__member-info">
                            <span className="artist-about__member-name">{member.name}</span>
                            <span className="artist-about__member-role">{member.role}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Info details */}
              {((artist as any).founded ||
                (artist as any).origin ||
                (artist as any).genres ||
                (artist as any).activeYears ||
                (artist as any).labels) && (
                <div className="artist-about__section anim-fade">
                  <h3 className="artist-about__heading">Info</h3>
                  <dl className="artist-about__details">
                    {(artist as any).founded && (
                      <div className="artist-about__detail-row">
                        <dt className="artist-about__detail-key">Founded</dt>
                        <dd className="artist-about__detail-val">{(artist as any).founded}</dd>
                      </div>
                    )}
                    {(artist as any).origin && (
                      <div className="artist-about__detail-row">
                        <dt className="artist-about__detail-key">Origin</dt>
                        <dd className="artist-about__detail-val">{(artist as any).origin}</dd>
                      </div>
                    )}
                    {(artist as any).genres && (
                      <div className="artist-about__detail-row">
                        <dt className="artist-about__detail-key">Genres</dt>
                        <dd className="artist-about__detail-val">
                          {(artist as any).genres.join(', ')}
                        </dd>
                      </div>
                    )}
                    {(artist as any).activeYears && (
                      <div className="artist-about__detail-row">
                        <dt className="artist-about__detail-key">Active Years</dt>
                        <dd className="artist-about__detail-val">{(artist as any).activeYears}</dd>
                      </div>
                    )}
                    {(artist as any).labels && (
                      <div className="artist-about__detail-row">
                        <dt className="artist-about__detail-key">Labels</dt>
                        <dd className="artist-about__detail-val">
                          {(artist as any).labels.join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Fallback si aucune donnée About */}
              {!(artist as any).members && !(artist as any).founded && !(artist as any).origin && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No additional information available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
