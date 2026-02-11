import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getArtistById } from '../lib/api/artists'
import LoadingSpinner from '../components/LoadingSpinner'
import AlbumCard from '../components/AlbumCard'
import type { Artist } from '@headbanger/shared'

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    const loadArtist = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getArtistById(id)

        if (!data) {
          setError('Artiste introuvable')
          return
        }

        setArtist(data)
      } catch (err) {
        console.error('Error loading artist:', err)
        setError('Erreur lors du chargement de l\'artiste')
      } finally {
        setLoading(false)
      }
    }

    loadArtist()
  }, [id, navigate])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (error || !artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
        <p className="text-foreground-muted text-lg text-center">{error || 'Artiste introuvable'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary hover:underline"
        >
          ← Retour
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* En-tête de l'artiste */}
        <div className="flex items-center gap-6">
          {/* Photo de l'artiste */}
          {artist.imageUrl ? (
            <div className="relative w-32 h-32 overflow-hidden rounded-full border-4 border-[var(--background-lighter)] bg-[var(--background-lighter)] flex-shrink-0">
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative w-32 h-32 overflow-hidden rounded-full border-4 border-[var(--background-lighter)] bg-[var(--background-lighter)] flex-shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}

          {/* Infos principales */}
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              Artiste
            </p>
            <h1 className="text-5xl font-bold text-[var(--foreground)] mt-2">
              {artist.name}
            </h1>

            {/* Statistiques */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-sm text-[var(--foreground-muted)]">
                  {artist.albums.length} {artist.albums.length > 1 ? 'albums' : 'album'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section des albums */}
        <div className="space-y-6">
          <div className="border-t border-[var(--background-lighter)] pt-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Discographie
            </h2>

            {artist.albums.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-[var(--foreground-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-[var(--foreground-muted)]">
                  Aucun album disponible pour cet artiste
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artist.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}