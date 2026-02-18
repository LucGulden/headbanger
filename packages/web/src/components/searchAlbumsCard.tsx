import { Link } from 'react-router-dom'
import { getHueFromString } from '../utils/hue'
import type { AlbumLight } from '@headbanger/shared'

export default function SearchAlbumCard({
  album,
  index = 0,
}: {
  album: AlbumLight
  index?: number
}) {
  const hue = getHueFromString(album.id)
  const artistNames = album.artists.map((a) => a.name).join(', ')

  return (
    <Link
      to={`/album/${album.id}`}
      className="album-card"
      style={{ '--cover-hue': hue, animationDelay: `${index * 0.06}s` } as React.CSSProperties}
    >
      <div className="album-card__cover">
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
          <div className="album-card__cover-grooves" />
        )}
        <div className="album-card__overlay" aria-hidden="true" />
      </div>
      <div className="album-card__info">
        <span className="album-card__title">{album.title}</span>
        <span className="album-card__artist">{artistNames}</span>
        {album.year && <span className="album-card__meta">{album.year}</span>}
      </div>
    </Link>
  )
}
