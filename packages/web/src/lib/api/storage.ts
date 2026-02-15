import imageCompression from 'browser-image-compression'
import { apiClient } from '../apiClient'

const MAX_SIZE_PX = 256
const MAX_SIZE_MB = 0.5

/**
 * Compresse et redimensionne une image pour l'avatar
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_SIZE_PX,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  }

  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error('Erreur lors de la compression:', error)
    throw new Error("Impossible de compresser l'image")
  }
}

/**
 * Upload la photo de profil vers le backend
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  // ✅ VALIDER AVANT la compression (file original a toujours .type)
  if (!file || !file.type) {
    throw new Error('Fichier invalide')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("L'image ne doit pas dépasser 5MB")
  }

  // Compression (peut retourner un Blob sans .type)
  const compressedFile = await compressImage(file)

  // Upload via apiClient
  const formData = new FormData()
  // ✅ Forcer le type webp explicitement
  formData.append('file', compressedFile, 'avatar.webp')

  const data = await apiClient.upload<{ url: string }>('/storage/upload/avatar', formData)
  return data.url
}

/**
 * Supprime la photo de profil
 */
export async function deleteProfilePhoto(): Promise<void> {
  await apiClient.delete<void>('/storage/avatar')
}

/**
 * Génère une preview locale de l'image (avant upload)
 */
export function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Erreur lors de la lecture de l'image"))
    reader.readAsDataURL(file)
  })
}
