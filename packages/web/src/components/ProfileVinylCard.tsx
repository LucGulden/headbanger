import { Link } from 'react-router-dom'
import { getHueFromString } from '../utils/hue'
import type { VinylLight } from '@headbanger/shared'

interface ProfileVinylCardProps {
  vinyl: VinylLight
  type: 'collection' | 'wishlist'
  index?: number
}

export default function ProfileVinylCard({ vinyl, type, index = 0 }: ProfileVinylCardProps) {
  const hue = getHueFromString(vinyl.id)
  // const artistNames = vinyl.album?.artists?.map((a) => a.name).join(', ') ?? ''
  const artistNames = 'TODO get from albums'
  return (
    <Link
      to={`/vinyl/${vinyl.id}`}
      className="vinyl-grid__item anim-fade"
      data-delay={index}
      style={{ '--cover-hue': hue } as React.CSSProperties}
    >
      <div className="vinyl-grid__cover">
        {vinyl.coverUrl ? (
          <img
            src={vinyl.coverUrl}
            alt={vinyl.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div className="vinyl-grid__cover-grooves" />
        )}
        {type === 'wishlist' && <span className="vinyl-grid__wish-badge">Wishlist</span>}
        <div className="vinyl-grid__overlay" aria-hidden="true">
          <div className="vinyl-grid__play">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>
      </div>
      <div className="vinyl-grid__info">
        <span className="vinyl-grid__title">{vinyl.title}</span>
        {artistNames && <span className="vinyl-grid__artist">{artistNames}</span>}
      </div>
    </Link>
  )
}
