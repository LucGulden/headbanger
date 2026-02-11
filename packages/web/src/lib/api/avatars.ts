import imageCompression from 'browser-image-compression'

const MAX_SIZE_PX = 256
const MAX_SIZE_MB = 0.5
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Compresse et redimensionne une image pour l'avatar
 * @param file - Fichier image original
 * @returns Fichier compressé
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_SIZE_PX,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Erreur lors de la compression:', error)
    throw new Error('Impossible de compresser l\'image')
  }
}

/**
 * Upload la photo de profil vers le backend
 * @param file - Fichier image à uploader
 * @returns URL publique de l'image
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  // Valider le type de fichier
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  // Valider la taille (max 5MB avant compression)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('L\'image ne doit pas dépasser 5MB')
  }

  try {
    // Compresser l'image
    const compressedFile = await compressImage(file)

    // Créer un FormData pour envoyer le fichier
    const formData = new FormData()
    formData.append('file', compressedFile, 'avatar.webp')

    // Upload vers le backend (userId sera récupéré via JWT)
    const response = await fetch(`${API_URL}/storage/upload/avatar`, {
      method: 'POST',
      credentials: 'include', // Envoyer les cookies httpOnly
      body: formData, // Ne pas mettre de Content-Type, fetch le gère automatiquement
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }))
      throw new Error(error.message || 'Impossible d\'uploader l\'image')
    }

    const data = await response.json()
    return data.url // Le backend retourne { url: string }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erreur lors de l\'upload de la photo')
  }
}

/**
 * Supprime la photo de profil de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function deleteProfilePhoto(): Promise<void> {
  const response = await fetch(`${API_URL}/storage/avatar`, {
    method: 'DELETE',
    credentials: 'include', // Envoyer les cookies httpOnly
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw new Error(error.message || 'Impossible de supprimer l\'image')
  }
}

/**
 * Génère une preview locale de l'image (avant upload)
 * @param file - Fichier image
 * @returns Data URL de l'image
 */
export function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erreur lors de la lecture de l\'image'))
    reader.readAsDataURL(file)
  })
}