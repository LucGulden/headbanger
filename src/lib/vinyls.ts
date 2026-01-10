import { supabase } from '../supabaseClient';
import type { Album, Vinyl, UserVinyl, UserVinylWithDetails } from '../types/vinyl';

const ITEMS_PER_PAGE = 20;

/**
 * Récupère les vinyles d'un utilisateur avec pagination
 */
export async function getUserVinyls(
  userId: string,
  type: 'collection' | 'wishlist',
  limit: number = ITEMS_PER_PAGE,
  lastAddedAt?: string
): Promise<UserVinylWithDetails[]> {
  let query = supabase
    .from('user_vinyls')
    .select(`
      *,
      vinyl:vinyls(*)
    `)
    .eq('user_id', userId)
    .eq('type', type)
    .order('added_at', { ascending: false })
    .limit(limit);

  // Cursor-based pagination
  if (lastAddedAt) {
    query = query.lt('added_at', lastAddedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`);
  }

  return (data || []) as UserVinylWithDetails[];
}

/**
 * Compte le nombre total de vinyles
 */
export async function getUserVinylsCount(
  userId: string,
  type: 'collection' | 'wishlist'
): Promise<number> {
  const { count, error } = await supabase
    .from('user_vinyls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type);

  if (error) {
    throw new Error(`Erreur lors du comptage: ${error.message}`);
  }

  return count || 0;
}

/**
 * Vérifie si un vinyle existe déjà dans la collection/wishlist de l'utilisateur
 */
export async function hasVinyl(
  userId: string,
  vinylId: string,
  type: 'collection' | 'wishlist'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_vinyls')
    .select('id')
    .eq('user_id', userId)
    .eq('release_id', vinylId)
    .eq('type', type);

  if (error) {
    console.error('Erreur lors de la vérification:', error);
    return false;
  }

  return data.length > 0;
}

/**
 * Ajoute un vinyle à la collection ou wishlist
 */
export async function addVinylToUser(
  userId: string,
  vinylId: string,
  type: 'collection' | 'wishlist'
): Promise<UserVinyl> {
  // Vérifier si déjà présent
  const exists = await hasVinyl(userId, vinylId, type);
  if (exists) {
    throw new Error(`Ce vinyle est déjà dans votre ${type === 'collection' ? 'collection' : 'wishlist'}`);
  }

  const { data, error } = await supabase
    .from('user_vinyls')
    .insert({
      user_id: userId,
      release_id: vinylId,
      type,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de l'ajout: ${error.message}`);
  }

  return data as UserVinyl;
}

/**
 * Retire un vinyle de la collection ou wishlist
 */
export async function removeVinylFromUser(
  userId: string,
  vinylId: string,
  type: 'collection' | 'wishlist'
): Promise<void> {
  const { error } = await supabase
    .from('user_vinyls')
    .delete()
    .eq('user_id', userId)
    .eq('release_id', vinylId)
    .eq('type', type);

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

/**
 * Déplace un vinyle de la wishlist vers la collection
 */
export async function moveToCollection(
  userId: string,
  vinylId: string
): Promise<void> {
  // Vérifier qu'il est dans la wishlist
  const inWishlist = await hasVinyl(userId, vinylId, 'wishlist');
  if (!inWishlist) {
    throw new Error('Ce vinyle n\'est pas dans votre wishlist');
  }

  // Vérifier qu'il n'est pas déjà dans la collection
  const inCollection = await hasVinyl(userId, vinylId, 'collection');
  if (inCollection) {
    throw new Error('Ce vinyle est déjà dans votre collection');
  }

  // Retirer de la wishlist
  await removeVinylFromUser(userId, vinylId, 'wishlist');

  // Ajouter à la collection
  await addVinylToUser(userId, vinylId, 'collection');
}

/**
 * Obtient les statistiques des vinyles d'un utilisateur
 */
export async function getVinylStats(userId: string): Promise<{
  collectionCount: number;
  wishlistCount: number;
}> {
  const [collectionCount, wishlistCount] = await Promise.all([
    getUserVinylsCount(userId, 'collection'),
    getUserVinylsCount(userId, 'wishlist'),
  ]);

  return {
    collectionCount,
    wishlistCount,
  };
}

/**
 * Recherche d'albums dans la base de données
 */
export async function searchAlbums(
  query: string,
  limit: number = 20
): Promise<Album[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .or(`title.ilike.${searchTerm},artist.ilike.${searchTerm}`)
    .order('artist', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Erreur lors de la recherche: ${error.message}`);
  }

  return data as Album[];
}

/**
 * Récupère tous les pressages vinyles d'un album
 */
export async function getVinylsByAlbum(albumId: string): Promise<Vinyl[]> {
  const { data, error } = await supabase
    .from('vinyls')
    .select('*')
    .eq('album_id', albumId)
    .order('year', { ascending: false }); // Plus récent en premier

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`);
  }

  return data as Vinyl[];
}
