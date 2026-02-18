import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getVinylById } from '../lib/api/vinyls'
import {
  hasVinyl,
  moveToCollection,
  removeVinylFromUser,
  addVinylToUser,
} from '../lib/api/userVinyls'
import type { Vinyl } from '@headbanger/shared'
import VinylCover from '../components/VinylCover'
import { getHueFromString } from '../utils/hue'
import { useAnimFade } from '../hooks/useAnimFade'
import '../styles/vinyl.css'

type TabId = 'tracklist' | 'details' | 'stats'

export default function VinylPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [vinyl, setVinyl] = useState<Vinyl | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inCollection, setInCollection] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [checkingOwnership, setCheckingOwnership] = useState(false)

  const [isMoving, setIsMoving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const [activeTab, setActiveTab] = useState<TabId>('tracklist')

  // Tabs indicator
  const tabsNavRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // Vinyl disc spin on hover
  const discRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const spinningRef = useRef(false)
  const animFrameRef = useRef<number>(0)

  useAnimFade([!!vinyl])

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getVinylById(id)
        if (!data) {
          setError('Vinyl not found')
          return
        }
        setVinyl(data)
      } catch {
        setError('Error loading vinyl')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  useEffect(() => {
    if (!user || !vinyl) {
      setInCollection(false)
      setInWishlist(false)
      return
    }
    let mounted = true
    const check = async () => {
      try {
        setCheckingOwnership(true)
        const [inCol, inWish] = await Promise.all([
          hasVinyl(vinyl.id, 'collection'),
          hasVinyl(vinyl.id, 'wishlist'),
        ])
        if (mounted) {
          setInCollection(inCol)
          setInWishlist(inWish)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setCheckingOwnership(false)
      }
    }
    check()
    return () => {
      mounted = false
    }
  }, [user, vinyl])

  // Position the tab indicator
  const positionIndicator = useCallback((btn: HTMLButtonElement) => {
    setIndicatorStyle({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [])

  useEffect(() => {
    if (!tabsNavRef.current) return
    const activeBtn = tabsNavRef.current.querySelector<HTMLButtonElement>(
      '.vinyl-tabs__btn.is-active',
    )
    if (activeBtn) positionIndicator(activeBtn)
  }, [activeTab, positionIndicator])

  useEffect(() => {
    const handleResize = () => {
      if (!tabsNavRef.current) return
      const activeBtn = tabsNavRef.current.querySelector<HTMLButtonElement>(
        '.vinyl-tabs__btn.is-active',
      )
      if (activeBtn) positionIndicator(activeBtn)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [positionIndicator])

  // Disc spin
  const spin = useCallback(() => {
    rotationRef.current += 0.5
    if (discRef.current) {
      discRef.current.style.transform = `rotate(${rotationRef.current}deg)`
    }
    if (spinningRef.current) {
      animFrameRef.current = requestAnimationFrame(spin)
    }
  }, [])

  const handleCoverMouseEnter = () => {
    spinningRef.current = true
    spin()
  }

  const handleCoverMouseLeave = () => {
    spinningRef.current = false
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }

  // Actions
  const handleAddToCollection = async () => {
    if (!vinyl) return
    try {
      setIsAdding(true)
      await addVinylToUser(vinyl.id, 'collection')
      setInCollection(true)
    } catch {
      alert('Error adding to collection')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!vinyl) return
    try {
      setIsAdding(true)
      await addVinylToUser(vinyl.id, 'wishlist')
      setInWishlist(true)
    } catch {
      alert('Error adding to wishlist')
    } finally {
      setIsAdding(false)
    }
  }

  const handleMoveToCollection = async () => {
    if (!vinyl) return
    try {
      setIsMoving(true)
      await moveToCollection(vinyl.id)
      setInWishlist(false)
      setInCollection(true)
    } catch {
      alert('Error moving to collection')
    } finally {
      setIsMoving(false)
    }
  }

  const handleRemoveFromCollection = async () => {
    if (!vinyl) return
    try {
      setIsRemoving(true)
      await removeVinylFromUser(vinyl.id, 'collection')
      setInCollection(false)
    } catch {
      alert('Error removing from collection')
    } finally {
      setIsRemoving(false)
    }
  }

  const handleRemoveFromWishlist = async () => {
    if (!vinyl) return
    try {
      setIsRemoving(true)
      await removeVinylFromUser(vinyl.id, 'wishlist')
      setInWishlist(false)
    } catch {
      alert('Error removing from wishlist')
    } finally {
      setIsRemoving(false)
    }
  }

  if (loading) {
    return (
      <main className="vinyl-page">
        <div className="vinyl-hero">
          <div className="vinyl-hero__inner">
            <div className="vinyl-hero__cover-wrap">
              <div className="vinyl-hero__cover" style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="vinyl-hero__info">
              <div
                style={{
                  height: '1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '40%',
                  marginBottom: '1rem',
                }}
              />
              <div
                style={{
                  height: '2.5rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '70%',
                  marginBottom: '0.75rem',
                }}
              />
              <div
                style={{
                  height: '1.2rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '30%',
                }}
              />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !vinyl) {
    return (
      <main className="vinyl-page">
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
          <h2 className="feed-empty__title">{error || 'Vinyl not found'}</h2>
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>
            ← Go back
          </button>
        </div>
      </main>
    )
  }

  const coverHue = getHueFromString(vinyl.id)
  const artistNames = vinyl.artists.map((a) => a.name).join(', ')

  const renderActions = () => {
    if (!user) {
      return (
        <div className="vinyl-hero__actions anim-fade" data-delay="5">
          <button
            className="btn btn--primary vinyl-hero__btn-collection"
            onClick={() => navigate('/login')}
          >
            <svg
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M9 2l2.1 4.26L16 6.93l-3.5 3.41.83 4.83L9 12.84l-4.33 2.33.83-4.83L2 6.93l4.9-.67L9 2z" />
            </svg>
            <span>Log in to collect</span>
          </button>
        </div>
      )
    }

    if (checkingOwnership) {
      return (
        <div className="vinyl-hero__actions anim-fade" data-delay="5">
          <button className="btn btn--ghost" disabled>
            <span style={{ opacity: 0.5 }}>Checking...</span>
          </button>
        </div>
      )
    }

    if (inCollection) {
      return (
        <div className="vinyl-hero__actions anim-fade" data-delay="5">
          <button
            className="btn btn--primary vinyl-hero__btn-collection is-active"
            onClick={handleRemoveFromCollection}
            disabled={isRemoving}
          >
            <svg
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M9 2l2.1 4.26L16 6.93l-3.5 3.41.83 4.83L9 12.84l-4.33 2.33.83-4.83L2 6.93l4.9-.67L9 2z" />
            </svg>
            <span>{isRemoving ? 'Removing...' : 'In Collection'}</span>
          </button>
        </div>
      )
    }

    if (inWishlist) {
      return (
        <div className="vinyl-hero__actions anim-fade" data-delay="5">
          <button
            className="btn btn--primary vinyl-hero__btn-collection"
            onClick={handleMoveToCollection}
            disabled={isMoving}
          >
            <svg
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M9 2l2.1 4.26L16 6.93l-3.5 3.41.83 4.83L9 12.84l-4.33 2.33.83-4.83L2 6.93l4.9-.67L9 2z" />
            </svg>
            <span>{isMoving ? 'Moving...' : 'Add to Collection'}</span>
          </button>
          <button
            className="btn btn--ghost vinyl-hero__btn-wishlist is-active"
            onClick={handleRemoveFromWishlist}
            disabled={isRemoving || isMoving}
          >
            <svg
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M9 15.5s-6.5-4.35-6.5-8.18A3.32 3.32 0 0 1 5.82 4c1.3 0 2.47.75 3.18 1.93A3.65 3.65 0 0 1 12.18 4 3.32 3.32 0 0 1 15.5 7.32C15.5 11.15 9 15.5 9 15.5z" />
            </svg>
            <span>{isRemoving ? 'Removing...' : 'Wishlisted'}</span>
          </button>
        </div>
      )
    }

    return (
      <div className="vinyl-hero__actions anim-fade" data-delay="5">
        <button
          className="btn btn--primary vinyl-hero__btn-collection"
          onClick={handleAddToCollection}
          disabled={isAdding}
        >
          <svg
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M9 2l2.1 4.26L16 6.93l-3.5 3.41.83 4.83L9 12.84l-4.33 2.33.83-4.83L2 6.93l4.9-.67L9 2z" />
          </svg>
          <span>{isAdding ? 'Adding...' : 'Add to Collection'}</span>
        </button>
        <button
          className="btn btn--ghost vinyl-hero__btn-wishlist"
          onClick={handleAddToWishlist}
          disabled={isAdding}
        >
          <svg
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M9 15.5s-6.5-4.35-6.5-8.18A3.32 3.32 0 0 1 5.82 4c1.3 0 2.47.75 3.18 1.93A3.65 3.65 0 0 1 12.18 4 3.32 3.32 0 0 1 15.5 7.32C15.5 11.15 9 15.5 9 15.5z" />
          </svg>
          <span>{isAdding ? 'Adding...' : 'Wishlist'}</span>
        </button>
      </div>
    )
  }

  return (
    <main className="vinyl-page">
      {/* BREADCRUMB */}
      <div className="vinyl-breadcrumb">
        <div className="vinyl-breadcrumb__inner">
          <Link to={`/album/${vinyl.album.id}`} className="vinyl-breadcrumb__link">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <polyline points="10,3 5,8 10,13" />
            </svg>
            {vinyl.album.title}
          </Link>
          <span className="vinyl-breadcrumb__sep">/</span>
          {/* TODO_catalogNumber: ajouter au type Vinyl */}
          <span className="vinyl-breadcrumb__current">
            {(vinyl as any).catalogNumber ?? vinyl.id}
          </span>
        </div>
      </div>

      {/* HERO */}
      <section className="vinyl-hero">
        <div className="vinyl-hero__bg" aria-hidden="true">
          <div className="vinyl-hero__glow vinyl-hero__glow--1" />
          <div className="vinyl-hero__glow vinyl-hero__glow--2" />
          <div className="vinyl-hero__grooves" />
        </div>

        <div className="vinyl-hero__inner">
          {/* Cover + disc */}
          <div
            className="vinyl-hero__cover-wrap anim-fade"
            data-delay="0"
            onMouseEnter={handleCoverMouseEnter}
            onMouseLeave={handleCoverMouseLeave}
          >
            <div
              className="vinyl-hero__cover"
              style={{ '--cover-hue': coverHue } as React.CSSProperties}
            >
              <div className="vinyl-hero__cover-art">
                {vinyl.coverUrl ? (
                  <img
                    src={vinyl.coverUrl}
                    alt={`${vinyl.title} - ${artistNames}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                ) : (
                  <>
                    <div className="vinyl-hero__cover-lines" />
                    <svg
                      className="vinyl-hero__cover-icon"
                      viewBox="0 0 80 80"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="0.75"
                        opacity="0.3"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        opacity="0.2"
                      />
                      <circle cx="40" cy="40" r="4" fill="currentColor" opacity="0.4" />
                    </svg>
                  </>
                )}
              </div>
              <div className="vinyl-hero__vinyl" aria-hidden="true">
                <div className="vinyl-hero__vinyl-disc" ref={discRef}>
                  <div className="vinyl-hero__vinyl-grooves" />
                  <div
                    className="vinyl-hero__vinyl-label"
                    style={{ '--cover-hue': coverHue } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="vinyl-hero__info">
            <span className="vinyl-hero__tag section-tag anim-fade" data-delay="1">
              Vinyl Release
            </span>
            <h1 className="vinyl-hero__title anim-fade" data-delay="2">
              {vinyl.title}
            </h1>

            <div className="vinyl-hero__artists anim-fade" data-delay="3">
              {vinyl.artists.map((a, i) => (
                <span key={a.id}>
                  <Link to={`/artist/${a.id}`} className="vinyl-hero__artist-link">
                    {a.name}
                  </Link>
                  {i < vinyl.artists.length - 1 && (
                    <span style={{ color: 'var(--text-muted)' }}> & </span>
                  )}
                </span>
              ))}
            </div>

            {/* Specs bar */}
            <div className="vinyl-hero__specs anim-fade" data-delay="4">
              {/* TODO_catalogNumber: ajouter au type Vinyl */}
              {(vinyl as any).catalogNumber && (
                <>
                  <div className="vinyl-hero__spec">
                    <span className="vinyl-hero__spec-label">Catalog</span>
                    <span className="vinyl-hero__spec-value">{(vinyl as any).catalogNumber}</span>
                  </div>
                  <div className="vinyl-hero__spec-divider" />
                </>
              )}
              {/* TODO_country: ajouter au type Vinyl */}
              {(vinyl as any).country && (
                <>
                  <div className="vinyl-hero__spec">
                    <span className="vinyl-hero__spec-label">Country</span>
                    <span className="vinyl-hero__spec-value">
                      <span className="vinyl-hero__country-badge">{(vinyl as any).country}</span>
                    </span>
                  </div>
                  <div className="vinyl-hero__spec-divider" />
                </>
              )}
              {vinyl.year && (
                <>
                  <div className="vinyl-hero__spec">
                    <span className="vinyl-hero__spec-label">Year</span>
                    <span className="vinyl-hero__spec-value">{vinyl.year}</span>
                  </div>
                  <div className="vinyl-hero__spec-divider" />
                </>
              )}
              {vinyl.label && (
                <>
                  <div className="vinyl-hero__spec">
                    <span className="vinyl-hero__spec-label">Label</span>
                    <span className="vinyl-hero__spec-value">{vinyl.label}</span>
                  </div>
                  <div className="vinyl-hero__spec-divider" />
                </>
              )}
              {vinyl.format && (
                <div className="vinyl-hero__spec">
                  <span className="vinyl-hero__spec-label">Format</span>
                  <span className="vinyl-hero__spec-value">{vinyl.format}</span>
                </div>
              )}
            </div>

            {renderActions()}
          </div>
        </div>
      </section>

      {/* TABS */}
      <section className="vinyl-tabs">
        <div className="vinyl-tabs__inner">
          <div
            className="vinyl-tabs__nav"
            ref={tabsNavRef}
            role="tablist"
            aria-label="Vinyl information"
          >
            {(
              [
                {
                  id: 'tracklist',
                  label: 'Tracklist',
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      aria-hidden="true"
                    >
                      <line x1="2" y1="4" x2="14" y2="4" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                      <line x1="2" y1="12" x2="10" y2="12" />
                    </svg>
                  ),
                },
                {
                  id: 'details',
                  label: 'Details',
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="8" r="6.5" />
                      <line x1="8" y1="5" x2="8" y2="8.5" />
                      <circle cx="8" cy="11" r="0.75" fill="currentColor" stroke="none" />
                    </svg>
                  ),
                },
                {
                  id: 'stats',
                  label: 'Stats',
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      aria-hidden="true"
                    >
                      <rect x="2" y="9" width="3" height="5" rx="0.5" />
                      <rect x="6.5" y="5" width="3" height="9" rx="0.5" />
                      <rect x="11" y="2" width="3" height="12" rx="0.5" />
                    </svg>
                  ),
                },
              ] as { id: TabId; label: string; icon: React.ReactNode }[]
            ).map((tab) => (
              <button
                key={tab.id}
                className={`vinyl-tabs__btn ${activeTab === tab.id ? 'is-active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={(e) => {
                  setActiveTab(tab.id)
                  positionIndicator(e.currentTarget)
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div
              className="vinyl-tabs__indicator"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </div>

          {/* Panel: Tracklist */}
          <div
            className={`vinyl-tabs__panel ${activeTab === 'tracklist' ? 'is-active' : ''}`}
            role="tabpanel"
            id="panel-tracklist"
            aria-labelledby="tab-tracklist"
            hidden={activeTab !== 'tracklist'}
          >
            {/* TODO_tracklist: ajouter tracklist (sides A/B avec tracks) au type Vinyl */}
            {(vinyl as any).tracklist ? (
              <div className="vinyl-tracklist">
                {(vinyl as any).tracklist.map(
                  (side: {
                    label: string
                    tracks: { position: string; name: string; duration: string }[]
                  }) => (
                    <div key={side.label} className="vinyl-tracklist__side">
                      <span className="vinyl-tracklist__side-label">Side {side.label}</span>
                      <ol className="vinyl-tracklist__list">
                        {side.tracks.map((track) => (
                          <li key={track.position} className="vinyl-tracklist__track">
                            <span className="vinyl-tracklist__num">{track.position}</span>
                            <span className="vinyl-tracklist__name">{track.name}</span>
                            <span className="vinyl-tracklist__duration">{track.duration}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No tracklist available.
              </p>
            )}
          </div>

          {/* Panel: Details */}
          <div
            className={`vinyl-tabs__panel ${activeTab === 'details' ? 'is-active' : ''}`}
            role="tabpanel"
            id="panel-details"
            aria-labelledby="tab-details"
            hidden={activeTab !== 'details'}
          >
            <dl className="vinyl-details">
              {/* TODO_genres: ajouter au type Vinyl */}
              {(vinyl as any).genres && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Genre</dt>
                  <dd className="vinyl-details__val">{(vinyl as any).genres.join(', ')}</dd>
                </div>
              )}
              {/* TODO_styles: ajouter au type Vinyl */}
              {(vinyl as any).styles && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Style</dt>
                  <dd className="vinyl-details__val">{(vinyl as any).styles.join(', ')}</dd>
                </div>
              )}
              {/* TODO_matrix: ajouter au type Vinyl */}
              {(vinyl as any).matrix && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Matrix / Runout</dt>
                  <dd className="vinyl-details__val vinyl-details__val--mono">
                    {(vinyl as any).matrix}
                  </dd>
                </div>
              )}
              {/* TODO_barcode: ajouter au type Vinyl */}
              {(vinyl as any).barcode && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Barcode</dt>
                  <dd className="vinyl-details__val vinyl-details__val--mono">
                    {(vinyl as any).barcode}
                  </dd>
                </div>
              )}
              {/* TODO_weight: ajouter au type Vinyl */}
              {(vinyl as any).weight && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Weight</dt>
                  <dd className="vinyl-details__val">{(vinyl as any).weight}</dd>
                </div>
              )}
              {/* TODO_color: ajouter au type Vinyl */}
              {(vinyl as any).color && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Color</dt>
                  <dd className="vinyl-details__val">{(vinyl as any).color}</dd>
                </div>
              )}
              {/* TODO_notes: ajouter au type Vinyl */}
              {(vinyl as any).notes && (
                <div className="vinyl-details__row">
                  <dt className="vinyl-details__key">Notes</dt>
                  <dd className="vinyl-details__val">{(vinyl as any).notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Panel: Stats */}
          <div
            className={`vinyl-tabs__panel ${activeTab === 'stats' ? 'is-active' : ''}`}
            role="tabpanel"
            id="panel-stats"
            aria-labelledby="tab-stats"
            hidden={activeTab !== 'stats'}
          >
            <div className="vinyl-stats">
              {/* TODO_stats: ajouter collectionCount/wishlistCount/avgRating/reviewsCount au type Vinyl */}
              <div className="vinyl-stats__card">
                <span className="vinyl-stats__number">{(vinyl as any).collectionCount ?? '—'}</span>
                <span className="vinyl-stats__label">In collections</span>
              </div>
              <div className="vinyl-stats__card">
                <span className="vinyl-stats__number">{(vinyl as any).wishlistCount ?? '—'}</span>
                <span className="vinyl-stats__label">On wishlists</span>
              </div>
              <div className="vinyl-stats__card">
                <span className="vinyl-stats__number">{(vinyl as any).avgRating ?? '—'}</span>
                <span className="vinyl-stats__label">Rating (avg)</span>
              </div>
              <div className="vinyl-stats__card">
                <span className="vinyl-stats__number">{(vinyl as any).reviewsCount ?? '—'}</span>
                <span className="vinyl-stats__label">Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARENT ALBUM */}
      <section className="vinyl-album">
        <div className="vinyl-album__inner">
          <div className="vinyl-album__header anim-fade" data-delay="0">
            <span className="section-tag">Parent Album</span>
            <h2 className="section-title">Part of</h2>
          </div>
          <Link
            to={`/album/${vinyl.album.id}`}
            className="vinyl-album__card anim-fade"
            data-delay="1"
            style={{ '--cover-hue': getHueFromString(vinyl.album.id) } as React.CSSProperties}
          >
            <VinylCover
              src={(vinyl.album as any).coverUrl}
              seed={vinyl.album.id}
              className="vinyl-album__cover"
            />
            <div className="vinyl-album__info">
              <span className="vinyl-album__name">{vinyl.album.title}</span>
              <span className="vinyl-album__artist">{artistNames}</span>
              <div className="vinyl-album__meta">
                {(vinyl.album as any).year && (
                  <>
                    <span className="vinyl-album__year">{(vinyl.album as any).year}</span>
                    <span className="vinyl-album__dot" />
                  </>
                )}
                {/* TODO_vinylCount: ajouter au type Album */}
                {(vinyl.album as any).vinylCount && (
                  <span className="vinyl-album__count">
                    {(vinyl.album as any).vinylCount} vinyl releases
                  </span>
                )}
              </div>
            </div>
            <div className="vinyl-album__arrow">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <line x1="4" y1="10" x2="16" y2="10" />
                <polyline points="11,5 16,10 11,15" />
              </svg>
            </div>
          </Link>
        </div>
      </section>
    </main>
  )
}
