import { apiClient } from './apiClient'
import { supabase } from '../../supabaseClient'
import { toCamelCase } from '../../utils/caseConverter'
import type { Vinyl } from '@fillcrate/shared'

// ============================================================================
// ROUTES BACKEND DISPONIBLES
// ============================================================================

/**
 * Récupère un vinyl par son ID (backend)
 */
export async function getVinylById(vinylId: string): Promise<Vinyl> {
  return apiClient.get<Vinyl>(`/vinyls/${vinylId}`)
}

// ============================================================================
// FONCTIONS SANS BACKEND - Supabase direct
// ============================================================================

/**
 * Récupère tous les pressages vinyles d'un album
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export async function getVinylsByAlbum(albumId: string): Promise<Vinyl[]> {
  const { data, error } = await supabase
    .from('vinyls')
    .select(`
      *,
      vinyl_artists(
        artist:artists(name)
      )
    `)
    .eq('album_id', albumId)
    .order('year', { ascending: false })

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`)
  }

  return (data || []).map((vinyl: any) => {
    const artists = vinyl.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
    return toCamelCase<Vinyl>({
      ...vinyl,
      artist: artists.join(', ') || 'Artiste inconnu',
      vinyl_artists: undefined,
    })
  })
}

/**
 * Crée un nouveau pressage vinyle
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export interface CreateVinylInput {
  albumId: string
  title: string
  artist: string
  year: number
  label: string
  catalogNumber: string
  country: string
  format: string
  coverUrl: string
  createdBy: string
}

export async function createVinyl(input: CreateVinylInput): Promise<Vinyl> {
  const dbParams = {
    p_album_id: input.albumId,
    p_title: input.title,
    p_artist_name: input.artist,
    p_year: input.year,
    p_label: input.label,
    p_catalog_number: input.catalogNumber,
    p_country: input.country,
    p_format: input.format,
    p_cover_url: input.coverUrl,
    p_created_by: input.createdBy,
  }

  const { data: vinylId, error: rpcError } = await supabase.rpc(
    'create_vinyl_with_artist',
    dbParams,
  )

  if (rpcError) {
    throw new Error(`Erreur lors de la création du vinyle: ${rpcError.message}`)
  }

  const { data: vinyl, error: fetchError } = await supabase
    .from('vinyls')
    .select(`
      *,
      vinyl_artists(
        artist:artists(name)
      )
    `)
    .eq('id', vinylId)
    .single()

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération du vinyle: ${fetchError.message}`)
  }

  const artists = vinyl.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
  return toCamelCase<Vinyl>({
    ...vinyl,
    artist: artists.join(', ') || 'Artiste inconnu',
    vinyl_artists: undefined,
  })
}

/**
 * Met à jour la cover d'un vinyle
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export async function updateVinylCover(vinylId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('vinyls')
    .update({ cover_url: coverUrl })
    .eq('id', vinylId)

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la cover: ${error.message}`)
  }
}