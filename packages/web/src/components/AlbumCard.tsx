import { Link } from 'react-router-dom'
import VinylImage from './VinylImage'
import type { AlbumLight } from '@fillcrate/shared'

interface AlbumCardProps {
  album: AlbumLight;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      to={`/album/${album.id}`}
      className="group block text-left transition-transform hover:scale-105"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)]">
        <VinylImage
          src={album.coverUrl || ''}
          alt={`${album.title} par ${album.artists.map(a => a.name).join(', ')}`}
          className="h-full w-full object-cover transition-transform"
        />
      </div>
      <h3 className="mt-3 truncate font-semibold text-[var(--foreground)]">
        {album.title}
      </h3>
      <p className="truncate text-sm text-[var(--foreground-muted)]">
        {album.artists.map((artist) => artist.name).join(', ')}
      </p>
      {album.year && (
        <p className="text-xs text-[var(--foreground-muted)]">{album.year}</p>
      )}
    </Link>
  )
}