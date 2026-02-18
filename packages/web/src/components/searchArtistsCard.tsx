import { Link } from 'react-router-dom'
import { getHueFromString } from '../utils/hue'
import type { ArtistLight } from '@headbanger/shared'

export default function SearchArtistCard({
  artist,
  index = 0,
}: {
  artist: ArtistLight
  index?: number
}) {
  const hue = getHueFromString(artist.id)
  const initials = artist.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link
      to={`/artist/${artist.id}`}
      className="artist-card"
      style={{ '--avatar-hue': hue, animationDelay: `${index * 0.06}s` } as React.CSSProperties}
    >
      <div className="artist-card__avatar">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <>
            <span>{initials}</span>
            <div className="artist-card__avatar-grooves" />
          </>
        )}
      </div>
      <h3 className="artist-card__name">{artist.name}</h3>
      {(artist as any).genres && (
        <span className="artist-card__genre">{(artist as any).genres[0]}</span>
      )}
      <div className="artist-card__stats">
        <span>
          {/* TODO changer le retour de la recherche pour l'adapter */}
          {/* <span className="artist-card__stat-value">{artist.albums.length}</span> albums */}
        </span>
      </div>
    </Link>
  )
}
