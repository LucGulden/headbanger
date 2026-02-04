import { apiClient } from './apiClient'
import { supabase } from '../../supabaseClient'
import { toCamelCase } from '../../utils/caseConverter'
import type { Album, AlbumLight } from '@fillcrate/shared'

/**
 * Récupère un album par son ID avec tous ses vinyles
 */
export async function getAlbumById(albumId: string): Promise<Album | null> {
  try {
    const album = await apiClient.get<Album>(`/albums/${albumId}`);
    return album;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

/**
 * Recherche d'albums par titre
 */
export async function searchAlbums(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<AlbumLight[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const albums = await apiClient.get<Album[]>(
      `/albums/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    );
    return albums;
  } catch (error) {
    console.error('Error searching albums:', error);
    return [];
  }
}

/**
 * Vérifie si un album existe déjà par son spotify_id
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export async function getAlbumBySpotifyId(spotifyId: string): Promise<Album | null> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('spotify_id', spotifyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Erreur lors de la recherche: ${error.message}`)
  }

  return toCamelCase<Album>(data)
}

/**
 * Crée un nouvel album
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export interface CreateAlbumInput {
  title: string
  artist: string
  year: number | null
  coverUrl: string | null
  spotifyId?: string | null
  spotifyUrl?: string | null
  createdBy: string
}

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const dbParams = {
    p_title: input.title,
    p_artist_name: input.artist,
    p_year: input.year,
    p_cover_url: input.coverUrl,
    p_spotify_id: input.spotifyId || null,
    p_spotify_url: input.spotifyUrl || null,
    p_created_by: input.createdBy,
  }

  const { data: albumId, error: rpcError } = await supabase.rpc(
    'create_album_with_artist',
    dbParams,
  )

  if (rpcError) {
    throw new Error(`Erreur lors de la création de l'album: ${rpcError.message}`)
  }

  const { data: album, error: fetchError } = await supabase
    .from('albums')
    .select(`
      *,
      album_artists(
        artist:artists(name)
      )
    `)
    .eq('id', albumId)
    .single()

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération de l'album: ${fetchError.message}`)
  }

  const artists = album.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
  return toCamelCase<Album>({
    ...album,
    artist: artists.join(', ') || 'Artiste inconnu',
    album_artists: undefined,
  })
}

/**
 * Met à jour la cover d'un album
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export async function updateAlbumCover(albumId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('albums')
    .update({ cover_url: coverUrl })
    .eq('id', albumId)

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la cover: ${error.message}`)
  }
}

/**
 * Récupère les albums d'un artiste
 * ⚠️ Pas encore de route backend, utilise Supabase directement
 */
export async function getAlbumsByArtist(artistId: string): Promise<Album[]> {
  const { data, error } = await supabase
    .from('album_artists')
    .select(`
      album:albums(
        *,
        album_artists(
          artist:artists(name)
        )
      )
    `)
    .eq('artist_id', artistId)

  if (error) {
    throw new Error(`Erreur lors de la récupération des albums: ${error.message}`)
  }

  return (data || [])
    .map((item: any) => {
      if (!item.album) return null
      const artists = item.album.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
      return toCamelCase<Album>({
        ...item.album,
        artist: artists.join(', ') || 'Artiste inconnu',
        album_artists: undefined,
      })
    })
    .filter(Boolean) as Album[]
}