import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getAlbumById } from '../lib/api/albums'
import LoadingSpinner from '../components/LoadingSpinner'
import VinylCard from '../components/VinylCard'
import type { Album } from '@headbanger/shared'

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    const loadAlbum = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAlbumById(id)

        if (!data) {
          setError('Album introuvable')
          return
        }

        setAlbum(data)
      } catch (err) {
        console.error('Error loading album:', err)
        setError('Erreur lors du chargement de l\'album')
      } finally {
        setLoading(false)
      }
    }

    loadAlbum()
  }, [id, navigate])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (error || !album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
        <p className="text-foreground-muted text-lg text-center">{error || 'Album introuvable'}</p>
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
        {/* En-tête de l'album */}
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Cover */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] md:w-[300px]">
            <img
              src={album.coverUrl}
              alt={`${album.title} - ${album.artists.map(a => a.name).join(', ')}`}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Infos principales */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                Album
              </p>
              <h1 className="text-4xl font-bold text-[var(--foreground)] mt-2">
                {album.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {album.artists.map((a, index) => (
                  <span key={a.id} className="flex items-center gap-2">
                    <Link key={a.id} className="text-xl font-medium text-[var(--foreground-muted)] transition-opacity hover:opacity-70" to={`/artist/${a.id}`}>
                      {a.name}
                    </Link>
                    {index < album.artists.length - 1 && (
                      <span className="text-[var(--foreground-muted)]">, </span>
                    )}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-lg text-[var(--foreground-muted)]">
                {album.year}
              </p>
            </div>

            {/* Statistiques */}
            <div className="flex items-center gap-4 pt-4 border-t border-[var(--background-lighter)]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-sm text-[var(--foreground-muted)]">
                  {album.vinyls.length} {album.vinyls.length > 1 ? 'pressages' : 'pressage'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section des vinyles */}
        <div className="space-y-6">
          <div className="border-t border-[var(--background-lighter)] pt-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Pressages disponibles
            </h2>

            {album.vinyls.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-[var(--foreground-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-[var(--foreground-muted)]">
                  Aucun pressage vinyle disponible pour cet album
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {album.vinyls.map((vinyl) => (
                  <VinylCard
                    key={vinyl.id}
                    vinyl={vinyl}
                    variant="full"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}