import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import imageCompression from 'browser-image-compression';

/**
 * Valide le fichier image
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Vérifier que c'est une image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Le fichier doit être une image' };
  }

  // Vérifier la taille (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { valid: false, error: 'L\'image ne doit pas dépasser 2MB' };
  }

  return { valid: true };
}

/**
 * Compresse une image si elle dépasse 500KB
 */
async function compressImage(file: File): Promise<File> {
  const maxSizeKB = 500;

  // Si l'image est déjà petite, pas besoin de compression
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: 0.5, // 500KB
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Erreur lors de la compression:', error);
    // Si la compression échoue, retourner le fichier original
    return file;
  }
}

/**
 * Upload une photo de profil
 * @param userId - ID de l'utilisateur
 * @param file - Fichier image à uploader
 * @returns URL publique de l'image
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  try {
    // Valider le fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Compresser l'image si nécessaire
    const compressedFile = await compressImage(file);

    // Créer la référence Storage
    const fileExtension = compressedFile.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `profile-photos/${userId}/avatar.${fileExtension}`);

    // Upload le fichier
    await uploadBytes(storageRef, compressedFile);

    // Récupérer l'URL publique
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error: any) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    throw new Error(error.message || 'Impossible d\'uploader la photo');
  }
}

/**
 * Supprime la photo de profil
 * @param userId - ID de l'utilisateur
 */
export async function deleteProfilePhoto(userId: string): Promise<void> {
  try {
    // Essayer de supprimer avec différentes extensions possibles
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    for (const ext of extensions) {
      try {
        const storageRef = ref(storage, `profile-photos/${userId}/avatar.${ext}`);
        await deleteObject(storageRef);
        return; // Si la suppression réussit, on arrête
      } catch (err: any) {
        // Ignorer l'erreur si le fichier n'existe pas
        if (err.code !== 'storage/object-not-found') {
          console.error(`Erreur lors de la suppression de avatar.${ext}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    // Ne pas throw, car l'absence de photo n'est pas une erreur critique
  }
}

/**
 * Génère une URL de preview pour un fichier image
 */
export function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Impossible de lire le fichier'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsDataURL(file);
  });
}
