import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getAlbumById } from '../lib/api/albums'
import type { Album } from '@headbanger/shared'
import VinylCover from '../components/VinylCover'
import { getHueFromString } from '../utils/hue'
import { useAnimFade } from '../hooks/useAnimFade'
import '../styles/album.css'

type SortKey = 'year' | 'country'

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('year')
  const [sortAnimating, setSortAnimating] = useState(false)

  // Disc spin
  const discRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const spinningRef = useRef(false)
  const animFrameRef = useRef<number>(0)

  useAnimFade([!!album])

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAlbumById(id)
        if (!data) {
          setError('Album not found')
          return
        }
        setAlbum(data)
      } catch {
        setError('Error loading album')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

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

  const handleSort = (key: SortKey) => {
    if (key === sort) return
    setSortAnimating(true)
    setTimeout(() => {
      setSort(key)
      setSortAnimating(false)
    }, 250)
  }

  const sortedVinyls = album
    ? [...album.vinyls].sort((a, b) => {
        if (sort === 'year') {
          return ((a as any).year ?? 0) - ((b as any).year ?? 0)
        }
        return ((a as any).country ?? '').localeCompare((b as any).country ?? '')
      })
    : []

  if (loading) {
    return (
      <main className="album-page">
        <div className="album-hero">
          <div className="album-hero__inner">
            <div className="album-hero__cover-wrap">
              <div className="album-hero__cover" style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="album-hero__info">
              <div
                style={{
                  height: '1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '20%',
                  marginBottom: '1rem',
                }}
              />
              <div
                style={{
                  height: '3rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '60%',
                  marginBottom: '0.75rem',
                }}
              />
              <div
                style={{
                  height: '1.2rem',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                  width: '25%',
                }}
              />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !album) {
    return (
      <main className="album-page">
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
          <h2 className="feed-empty__title">{error || 'Album not found'}</h2>
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>
            ← Go back
          </button>
        </div>
      </main>
    )
  }

  const coverHue = getHueFromString(album.id)
  const artistNames = album.artists.map((a) => a.name).join(', ')

  return (
    <main className="album-page">
      {/* HERO */}
      <section className="album-hero">
        <div className="album-hero__bg" aria-hidden="true">
          <div className="album-hero__glow album-hero__glow--1"></div>
          <div className="album-hero__glow album-hero__glow--2"></div>
          <div className="album-hero__grooves"></div>
        </div>

        <div className="album-hero__inner">
          {/* Cover + disc */}
          <div
            className="album-hero__cover-wrap anim-fade"
            data-delay="0"
            onMouseEnter={handleCoverMouseEnter}
            onMouseLeave={handleCoverMouseLeave}
          >
            <div
              className="album-hero__cover"
              style={{ '--cover-hue': coverHue } as React.CSSProperties}
            >
              <div className="album-hero__cover-art">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={`${album.title} - ${artistNames}`}
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
                    <div className="album-hero__cover-lines"></div>
                    <svg
                      className="album-hero__cover-icon"
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
              <div className="album-hero__vinyl" aria-hidden="true">
                <div className="album-hero__vinyl-disc" ref={discRef}>
                  <div className="album-hero__vinyl-grooves"></div>
                  <div
                    className="album-hero__vinyl-label"
                    style={{ '--cover-hue': coverHue } as React.CSSProperties}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="album-hero__info">
            <span className="album-hero__tag section-tag anim-fade" data-delay="1">
              Album
            </span>
            <h1 className="album-hero__title anim-fade" data-delay="2">
              {album.title}
            </h1>

            <div className="album-hero__artists anim-fade" data-delay="3">
              {album.artists.map((a, i) => (
                <span key={a.id}>
                  <Link to={`/artist/${a.id}`} className="album-hero__artist-link">
                    {a.name}
                  </Link>
                  {i < album.artists.length - 1 && (
                    <span className="album-hero__artist-separator"> & </span>
                  )}
                </span>
              ))}
            </div>

            <div className="album-hero__meta anim-fade" data-delay="4">
              {album.year && (
                <>
                  <span className="album-hero__year">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      aria-hidden="true"
                    >
                      <rect x="2" y="3" width="12" height="11" rx="1.5" />
                      <line x1="2" y1="7" x2="14" y2="7" />
                      <line x1="5.5" y1="1" x2="5.5" y2="4.5" />
                      <line x1="10.5" y1="1" x2="10.5" y2="4.5" />
                    </svg>
                    {album.year}
                  </span>
                  <span className="album-hero__divider"></span>
                </>
              )}
              <span className="album-hero__releases-count">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="6.5" />
                  <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
                </svg>
                {album.vinyls.length} {album.vinyls.length > 1 ? 'releases' : 'release'}
              </span>
              {/* TODO_genre: ajouter au type Album */}
              {(album as any).genre && (
                <>
                  <span className="album-hero__divider"></span>
                  <span className="album-hero__genre">{(album as any).genre}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRACKLIST */}
      {/* TODO_tracklist: ajouter au type Album */}
      {(album as any).tracklist && (
        <section className="album-tracklist">
          <div className="album-tracklist__inner">
            <h2 className="album-tracklist__heading anim-fade" data-delay="0">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                aria-hidden="true"
              >
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="12" y2="15" />
              </svg>
              Tracklist
            </h2>
            <ol className="album-tracklist__list">
              {(album as any).tracklist.map(
                (track: { position: string; name: string; duration: string }, i: number) => (
                  <li
                    key={track.position}
                    className="album-tracklist__track anim-fade"
                    data-delay={i + 1}
                  >
                    <span className="album-tracklist__num">{track.position}</span>
                    <span className="album-tracklist__name">{track.name}</span>
                    <span className="album-tracklist__duration">{track.duration}</span>
                  </li>
                ),
              )}
            </ol>
          </div>
        </section>
      )}

      {/* VINYL RELEASES */}
      <section className="album-releases" id="releases">
        <div className="album-releases__inner">
          <div className="album-releases__header anim-fade" data-delay="0">
            <div>
              <span className="section-tag">Vinyl Releases</span>
              <h2 className="section-title">All Pressings</h2>
            </div>
            <div className="album-releases__sort">
              <button
                className={`album-releases__sort-btn ${sort === 'year' ? 'is-active' : ''}`}
                onClick={() => handleSort('year')}
              >
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <line x1="2" y1="3" x2="12" y2="3" />
                  <line x1="2" y1="7" x2="9" y2="7" />
                  <line x1="2" y1="11" x2="6" y2="11" />
                </svg>
                Year
              </button>
              <button
                className={`album-releases__sort-btn ${sort === 'country' ? 'is-active' : ''}`}
                onClick={() => handleSort('country')}
              >
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="5.5" />
                  <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
                  <line x1="1.5" y1="7" x2="12.5" y2="7" />
                </svg>
                Country
              </button>
            </div>
          </div>

          {album.vinyls.length === 0 ? (
            <div className="feed-empty">
              <h2 className="feed-empty__title">No pressings yet</h2>
              <p className="feed-empty__desc">No vinyl releases available for this album.</p>
            </div>
          ) : (
            <div
              className="album-releases__grid"
              style={{
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                opacity: sortAnimating ? 0 : 1,
                transform: sortAnimating ? 'translateY(12px)' : 'translateY(0)',
              }}
            >
              {sortedVinyls.map((vinyl, i) => (
                <Link
                  key={vinyl.id}
                  to={`/vinyl/${vinyl.id}`}
                  className="release-card anim-fade"
                  data-delay={i + 1}
                  {...({
                    'data-year': (vinyl as any).year,
                    'data-country': (vinyl as any).country,
                  } as any)}
                >
                  <div className="release-card__top">
                    <VinylCover
                      src={vinyl.coverUrl}
                      seed={vinyl.id}
                      className="release-card__cover"
                    />
                    {/* TODO_country: ajouter au type Vinyl */}
                    {(vinyl as any).country && (
                      <div className="release-card__flag">
                        <span className="release-card__country-code">{(vinyl as any).country}</span>
                      </div>
                    )}
                  </div>
                  <div className="release-card__info">
                    {/* TODO_catalogNumber: ajouter au type Vinyl */}
                    <span className="release-card__catalog">
                      {(vinyl as any).catalogNumber ?? vinyl.title}
                    </span>
                    {vinyl.label && <span className="release-card__label">{vinyl.label}</span>}
                    <div className="release-card__meta">
                      {vinyl.year && <span className="release-card__year">{vinyl.year}</span>}
                      {vinyl.format && <span className="release-card__format">{vinyl.format}</span>}
                    </div>
                  </div>
                  <div className="release-card__arrow">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <line x1="3" y1="8" x2="13" y2="8" />
                      <polyline points="9,4 13,8 9,12" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
