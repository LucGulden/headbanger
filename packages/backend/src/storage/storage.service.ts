import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../common/database/supabase.service'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

@Injectable()
export class StorageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Upload un avatar pour un utilisateur
   * Écrase automatiquement l'ancien avatar si existant
   */
  async uploadAvatar(
    token: string,
    userId: string,
    file: Buffer,
    mimetype: string,
  ): Promise<string> {
    // Validation type de fichier
    if (!ALLOWED_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.',
      )
    }

    // Validation taille (5MB max)
    if (file.length > MAX_FILE_SIZE) {
      throw new BadRequestException('Le fichier ne doit pas dépasser 5MB')
    }

    const supabase = this.supabaseService.getClientWithAuth(token)

    // Nom du fichier : userId.webp (écrase l'ancien)
    const filename = `${userId}.webp`

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filename, file, {
        contentType: 'image/webp',
        upsert: true, // Écrase si existe déjà
      })

    if (uploadError) {
      throw new BadRequestException(`Erreur lors de l'upload: ${uploadError.message}`)
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filename)

    return publicUrl
  }

  /**
   * Supprime l'avatar d'un utilisateur
   */
  async deleteAvatar(token: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const filename = `${userId}.webp`

    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([filename])

    if (error) {
      throw new BadRequestException(`Erreur lors de la suppression: ${error.message}`)
    }
  }
}
