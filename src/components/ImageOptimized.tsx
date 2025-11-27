'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageOptimizedProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
}

/**
 * Composant wrapper autour de next/image avec :
 * - Support AVIF/WebP automatique
 * - Gestion d'erreur avec fallback
 * - Placeholder shimmer pour meilleure UX
 * - Loading lazy par défaut
 *
 * Usage:
 * ```tsx
 * <ImageOptimized
 *   src="https://i.scdn.co/image/..."
 *   alt="Album cover"
 *   width={300}
 *   height={300}
 * />
 * ```
 */
export default function ImageOptimized({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  objectFit = 'cover',
  onLoad,
}: ImageOptimizedProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleError = () => {
    setHasError(true);
    setImageLoaded(true);
  };

  // Fallback image (icône vinyle générique)
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[var(--background-lighter)] to-[var(--background)] ${className}`}
        style={!fill && width && height ? { width, height } : undefined}
      >
        <svg
          className="text-[var(--foreground-muted)]"
          width={width ? Math.min(width * 0.4, 64) : 64}
          height={height ? Math.min(height * 0.4, 64) : 64}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2a10 10 0 0 1 0 20" opacity="0.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Shimmer placeholder */}
      {!imageLoaded && (
        <div
          className={`absolute inset-0 overflow-hidden ${className}`}
          style={!fill && width && height ? { width, height } : undefined}
        >
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-[var(--background-lighter)] via-[var(--background)] to-[var(--background-lighter)] bg-[length:200%_100%]">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={{ objectFit }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
