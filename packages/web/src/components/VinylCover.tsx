import { useState } from 'react'
import { getHueFromString } from '../utils/hue'
import '../styles/vinyl-cover.css'

interface VinylCoverProps {
  /** URL de l'image réelle (optionnelle) */
  src?: string | null
  /** Texte pour générer la teinte du placeholder (titre, id, etc.) */
  seed: string
  alt?: string
  className?: string
  priority?: boolean
}

export default function VinylCover({
  src,
  seed,
  alt = '',
  className = '',
  priority = false,
}: VinylCoverProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const hue = getHueFromString(seed)

  return (
    <div
      className={`vinyl-cover ${className}`}
      style={{ '--cover-hue': hue } as React.CSSProperties}
    >
      {/* Placeholder CSS — visible tant que l'image n'est pas chargée */}
      {(!src || !imageLoaded) && (
        <>
          <div className="vinyl-cover__grooves"></div>
          <div className="vinyl-cover__vinyl"></div>
        </>
      )}

      {src && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setImageLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      )}
    </div>
  )
}
