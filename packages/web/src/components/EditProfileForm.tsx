import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadProfilePhoto, generateImagePreview } from '../lib/api/storage'
import {
  updateUserProfile,
  checkUsernameAvailability,
  validateUsername,
  validateBio,
} from '../lib/api/users'
import { useUserStore } from '../stores/userStore'
import type { User } from '@headbanger/shared'

interface EditProfileFormProps {
  user: User
  onSuccess?: () => void
  onError?: (msg: string) => void
}

interface FormData {
  username: string
  firstName: string
  lastName: string
  bio: string
}

export default function EditProfileForm({ user, onSuccess, onError }: EditProfileFormProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateAppUser } = useUserStore()

  const [formData, setFormData] = useState<FormData>({
    username: user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoUrl || null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(true)

  // Vérifier la disponibilité du username en temps réel
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username === user.username) {
        setUsernameAvailable(true)
        return
      }

      if (!validateUsername(formData.username)) {
        setUsernameAvailable(false)
        return
      }

      setCheckingUsername(true)
      try {
        const available = await checkUsernameAvailability(formData.username, user.uid)
        setUsernameAvailable(available)
      } catch (error) {
        console.error('Erreur lors de la vérification du username:', error)
      } finally {
        setCheckingUsername(false)
      }
    }

    const debounce = setTimeout(checkUsername, 500)
    return () => clearTimeout(debounce)
  }, [formData.username, user.username, user.uid])

  // Gestion de la sélection de fichier
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valider le fichier
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, photo: 'Le fichier doit être une image' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, photo: "L'image ne doit pas dépasser 5MB" })
      return
    }

    try {
      const preview = await generateImagePreview(file)
      setPhotoFile(file)
      setPhotoPreview(preview)
      setErrors({ ...errors, photo: '' })
    } catch {
      setErrors({ ...errors, photo: "Erreur lors de la lecture de l'image" })
    }
  }

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.username) {
      newErrors.username = "Le nom d'utilisateur est requis"
    } else if (!validateUsername(formData.username)) {
      newErrors.username = "Nom d'utilisateur invalide (3-20 caractères, lettres, chiffres, - et _)"
    } else if (!usernameAvailable) {
      newErrors.username = "Ce nom d'utilisateur est déjà pris"
    }

    if (formData.bio && !validateBio(formData.bio)) {
      newErrors.bio = 'La bio ne peut pas dépasser 200 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      let photoUrl = user.photoUrl

      // Upload de la nouvelle photo si sélectionnée
      if (photoFile) {
        photoUrl = await uploadProfilePhoto(photoFile)
      }

      const updates = {
        username: formData.username,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        bio: formData.bio || undefined,
        photoUrl: photoUrl || undefined,
      }

      // Mise à jour du profil en BDD
      await updateUserProfile(updates)

      // Mise à jour du store Zustand (met à jour la navbar automatiquement)
      updateAppUser(updates)

      // Callback de succès
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(`/profile/${formData.username}`)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      const msg = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil'
      setErrors({ submit: msg })
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  // Gestion des changements de champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="settings__form">
      {/* Erreur globale */}
      {errors.submit && (
        <div
          className="settings__card"
          style={{ borderColor: 'var(--wishlist)', marginBottom: 'var(--space-md)' }}
        >
          <p style={{ color: 'var(--wishlist)', fontSize: '0.88rem' }}>{errors.submit}</p>
        </div>
      )}

      {/* Avatar */}
      <div className="settings__card anim-fade" data-delay="2">
        <h2 className="settings__card-title">Profile Picture</h2>
        <p className="settings__card-desc">Upload a profile picture. JPG, PNG or GIF. Max 5MB.</p>
        <div className="settings__avatar-area">
          <div className="settings__avatar">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile picture preview" />
            ) : (
              <svg
                className="settings__avatar-placeholder"
                viewBox="0 0 120 120"
                fill="none"
                aria-hidden="true"
              >
                <rect width="120" height="120" rx="60" fill="#1e1e26" />
                <circle cx="60" cy="46" r="20" fill="#2a2a35" />
                <ellipse cx="60" cy="95" rx="32" ry="22" fill="#2a2a35" />
                <text
                  x="60"
                  y="56"
                  textAnchor="middle"
                  fill="#d4a843"
                  fontFamily="'Clash Display', sans-serif"
                  fontWeight="600"
                  fontSize="28"
                >
                  {formData.username.slice(0, 2).toUpperCase()}
                </text>
              </svg>
            )}
          </div>
          <div className="settings__avatar-actions">
            <label className="btn btn--primary settings__avatar-upload-btn" htmlFor="avatarInput">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M1 11v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
                <polyline points="4,5 8,1 12,5" />
                <line x1="8" y1="1" x2="8" y2="11" />
              </svg>
              Upload
            </label>
            <input
              ref={fileInputRef}
              id="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileSelect}
              className="settings__avatar-input"
              aria-label="Upload profile picture"
            />
            <button
              type="button"
              className="btn btn--ghost settings__avatar-remove-btn"
              onClick={() => {
                setPhotoFile(null)
                setPhotoPreview(null)
              }}
            >
              Remove
            </button>
          </div>
          {errors.photo && <span className="settings__error is-visible">{errors.photo}</span>}
        </div>
      </div>

      {/* Profile info */}
      <div className="settings__card anim-fade" data-delay="3">
        <h2 className="settings__card-title">Profile Information</h2>
        <p className="settings__card-desc">
          This information will be visible on your public profile.
        </p>

        <div className="settings__fields">
          {/* Username */}
          <div className="settings__field">
            <label className="settings__label" htmlFor="username">
              Username
              <span className="settings__label-required">Required</span>
            </label>
            <div className="settings__input-wrap">
              <span className="settings__input-prefix">@</span>
              <input
                id="username"
                name="username"
                type="text"
                className={`settings__input settings__input--prefixed ${errors.username ? 'is-error' : usernameAvailable && formData.username !== user.username && formData.username.length >= 3 ? 'is-valid' : ''}`}
                value={formData.username}
                onChange={handleChange}
                disabled={loading || checkingUsername}
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
                spellCheck={false}
              />
            </div>
            <span className="settings__hint">
              Lowercase letters, numbers, and hyphens only. 3–30 characters.
            </span>
            {checkingUsername && <span className="settings__hint">Checking availability…</span>}
            <span
              className={`settings__error ${errors.username ? 'is-visible' : ''}`}
              role="alert"
              aria-live="polite"
            >
              {errors.username}
            </span>
          </div>

          {/* First / Last name */}
          <div className="settings__field-row">
            <div className="settings__field">
              <label className="settings__label" htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="settings__input"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                maxLength={50}
                autoComplete="given-name"
              />
            </div>
            <div className="settings__field">
              <label className="settings__label" htmlFor="lastName">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="settings__input"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                maxLength={50}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="settings__field">
            <label className="settings__label" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              className="settings__textarea"
              value={formData.bio}
              onChange={handleChange}
              disabled={loading}
              maxLength={300}
              rows={4}
              spellCheck
            />
            <div className="settings__textarea-footer">
              <span
                className={`settings__char-count ${formData.bio.length >= 255 && formData.bio.length < 300 ? 'is-near-limit' : ''} ${formData.bio.length >= 300 ? 'is-at-limit' : ''}`}
              >
                {formData.bio.length} / 300
              </span>
            </div>
            <span className={`settings__error ${errors.bio ? 'is-visible' : ''}`}>
              {errors.bio}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="settings__actions anim-fade" data-delay="4">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setFormData({
              username: user.username,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              bio: user.bio || '',
            })
            setPhotoFile(null)
            setPhotoPreview(user.photoUrl || null)
            setErrors({})
          }}
          disabled={loading}
        >
          Discard Changes
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading || checkingUsername || !usernameAvailable}
        >
          <span>{loading ? 'Saving…' : 'Save Changes'}</span>
          {!loading && (
            <svg
              className="settings__save-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <polyline points="3,8.5 6.5,12 13,4" />
            </svg>
          )}
        </button>
      </div>
    </form>
  )
}
