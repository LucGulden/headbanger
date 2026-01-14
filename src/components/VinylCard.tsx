import type { Vinyl } from '../types/vinyl';
import VinylImage from './VinylImage';

interface VinylCardProps {
  vinyl: Vinyl;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export default function VinylCard({ vinyl, actions, onClick }: VinylCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20 cursor-pointer"
      onClick={onClick}
    >
      {/* Pochette */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--background)]">
        <VinylImage
          src={vinyl.cover_url ?? ''}
          alt={`${vinyl.title} par ${vinyl.artist}`}
          className="h-full w-full object-cover transition-all duration-300"
        />

        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Actions personnalisées */}
          {actions && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="p-4">
        {/* Titre */}
        <h3 
          className="mb-1 line-clamp-1 font-semibold text-[var(--foreground)]" 
          title={vinyl.title}
        >
          {vinyl.title}
        </h3>

        {/* Artiste */}
        <p 
          className="mb-1 line-clamp-1 text-sm text-[var(--foreground-muted)]" 
          title={vinyl.artist}
        >
          {vinyl.artist}
        </p>

        {/* Année */}
        {(vinyl.year) && (
          <p className="text-xs text-[var(--foreground-muted)]">
            {vinyl.year}
          </p>
        )}
      </div>
    </div>
  );
}