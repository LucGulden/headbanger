import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getVinylById } from '../lib/api/vinyls'
import { hasVinyl, moveToCollection, removeVinylFromUser, addVinylToUser } from '../lib/api/userVinyls'
import { useVinylStatsStore } from '../stores/vinylStatsStore'
import type { Vinyl } from '@fillcrate/shared'
import VinylImage from '../components/VinylImage'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

export default function VinylPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // États du vinyle
  const [vinyl, setVinyl] = useState<Vinyl | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États de possession
  const [inCollection, setInCollection] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [checkingOwnership, setCheckingOwnership] = useState(false)

  // États d'actions
  const [isMoving, setIsMoving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Store Zustand
  const { incrementCollection, decrementCollection, incrementWishlist, decrementWishlist } = useVinylStatsStore()

  // Charger le vinyle
  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    const loadVinyl = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getVinylById(id)

        if (!data) {
          setError('Vinyle introuvable')
          return
        }

        setVinyl(data)
      } catch (err) {
        console.error('Error loading vinyl:', err)
        setError('Erreur lors du chargement du vinyle')
      } finally {
        setLoading(false)
      }
    }

    loadVinyl()
  }, [id, navigate])

  // Vérifier la possession si connecté
  useEffect(() => {
    if (!user || !vinyl) {
      setInCollection(false)
      setInWishlist(false)
      return
    }

    let isMounted = true

    const checkOwnership = async () => {
      try {
        setCheckingOwnership(true)
        const [inCol, inWish] = await Promise.all([
          hasVinyl(vinyl.id, 'collection'),
          hasVinyl(vinyl.id, 'wishlist'),
        ])

        if (isMounted) {
          setInCollection(inCol)
          setInWishlist(inWish)
        }
      } catch (err) {
        console.error('Erreur vérification statut:', err)
      } finally {
        if (isMounted) {
          setCheckingOwnership(false)
        }
      }
    }

    checkOwnership()

    return () => {
      isMounted = false
    }
  }, [user, vinyl])

  // Actions
  const handleAddToCollection = async () => {
    if (!vinyl) return

    try {
      setIsAdding(true)
      await addVinylToUser(vinyl.id, 'collection')
      setInCollection(true)
      incrementCollection()
    } catch (err) {
      console.error('Erreur ajout collection:', err)
      alert('Erreur lors de l\'ajout à la collection')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!vinyl) return

    try {
      setIsAdding(true)
      await addVinylToUser(vinyl.id, 'wishlist')
      setInWishlist(true)
      incrementWishlist()
    } catch (err) {
      console.error('Erreur ajout wishlist:', err)
      alert('Erreur lors de l\'ajout à la wishlist')
    } finally {
      setIsAdding(false)
    }
  }

  const handleMoveToCollection = async () => {
    if (!vinyl) return

    try {
      setIsMoving(true)
      await moveToCollection(vinyl.id)
      setInWishlist(false)
      setInCollection(true)

      // Mise à jour du store : -1 wishlist, +1 collection
      decrementWishlist()
      incrementCollection()
    } catch (err) {
      console.error('Erreur déplacement:', err)
      alert('Erreur lors du déplacement vers la collection')
    } finally {
      setIsMoving(false)
    }
  }

  const handleRemoveFromCollection = async () => {
    if (!vinyl) return

    try {
      setIsRemoving(true)
      await removeVinylFromUser(vinyl.id, 'collection')
      setInCollection(false)
      decrementCollection()
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    } finally {
      setIsRemoving(false)
    }
  }

  const handleRemoveFromWishlist = async () => {
    if (!vinyl) return

    try {
      setIsRemoving(true)
      await removeVinylFromUser(vinyl.id, 'wishlist')
      setInWishlist(false)
      decrementWishlist()
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    } finally {
      setIsRemoving(false)
    }
  }

  // Rendu des actions selon l'état
  const renderActions = () => {
    // Si non connecté
    if (!user) {
      return (
        <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-6 text-center">
          <p className="mb-4 text-[var(--foreground-muted)]">
            Connectez-vous pour ajouter ce vinyle à votre collection ou wishlist
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              className="w-full sm:w-auto"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Créer un compte
            </Button>
          </div>
        </div>
      )
    }

    // Si en train de vérifier
    if (checkingOwnership) {
      return (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )
    }

    // Si en collection
    if (inCollection) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="flex items-center gap-2 text-sm text-green-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Ce vinyle est dans votre collection
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleRemoveFromCollection}
              variant="outline"
              disabled={isRemoving}
              className="w-full border-red-500/30 text-red-500 hover:border-red-500 hover:bg-red-500/10 sm:w-auto"
            >
              {isRemoving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Suppression...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Retirer de ma collection
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    // Si en wishlist
    if (inWishlist) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="mb-3 text-sm text-blue-400">
              Ce vinyle est dans votre wishlist. Le déplacer vers la collection le retirera automatiquement de la wishlist.
            </p>
            <Button
              onClick={handleMoveToCollection}
              variant="primary"
              disabled={isMoving}
              className="w-full sm:w-auto"
            >
              {isMoving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Déplacement...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  J'ai acheté !
                </>
              )}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleRemoveFromWishlist}
              variant="outline"
              disabled={isMoving || isRemoving}
              className="w-full border-red-500/30 text-red-500 hover:border-red-500 hover:bg-red-500/10 sm:w-auto"
            >
              {isRemoving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Suppression...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Retirer de ma wishlist
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    // Ni collection ni wishlist → 2 boutons d'ajout
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={handleAddToCollection}
          variant="primary"
          disabled={isAdding}
          className="w-full sm:w-auto"
        >
          {isAdding ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Ajout...
            </>
          ) : (
            'Ajouter à ma collection'
          )}
        </Button>
        <Button
          onClick={handleAddToWishlist}
          variant="outline"
          disabled={isAdding}
          className="w-full sm:w-auto"
        >
          {isAdding ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Ajout...
            </>
          ) : (
            'Ajouter à ma wishlist'
          )}
        </Button>
      </div>
    )
  }

  // Loading
  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  // Error ou vinyle introuvable
  if (error || !vinyl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
        <p className="text-foreground-muted text-lg text-center">{error || 'Vinyle introuvable'}</p>
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Cover et infos principales */}
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Cover */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] md:w-[300px]">
            <VinylImage
              src={vinyl.coverUrl || ''}
              alt={`${vinyl.title} - ${vinyl.artists.map(a => a.name).join(', ')}`}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Infos principales */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{vinyl.title}</h1>
              <p className="mt-1 text-lg font-medium text-[var(--foreground-muted)]">
                {vinyl.artists.map(a => a.name).join(', ')}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {vinyl.year}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {inCollection && (
                <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>En collection</span>
                </div>
              )}

              {inWishlist && (
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>En wishlist</span>
                </div>
              )}
            </div>

            {/* Détails de l'édition */}
            <div className="space-y-3 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                Détails de l'édition
              </h2>
              <div className="space-y-2">
                {vinyl.label && <DetailRow label="Label" value={vinyl.label} />}
                {vinyl.catalogNumber && <DetailRow label="Numéro de catalogue" value={vinyl.catalogNumber} />}
                {vinyl.country && <DetailRow label="Pays" value={vinyl.country} />}
                {vinyl.format && <DetailRow label="Format" value={vinyl.format} />}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--background-lighter)] pt-6">
          {renderActions()}
        </div>
      </div>
    </div>
  )
}

// Helper component
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)] text-right">{value}</span>
    </div>
  )
}