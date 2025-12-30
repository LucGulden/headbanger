import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Recherche d'utilisateurs par username ou nom
 * Note: Firestore ne supporte pas les recherches textuelles avancées.
 * Pour une meilleure expérience, il faudrait utiliser Algolia ou Elasticsearch.
 * Ici, on récupère tous les utilisateurs et on filtre côté client.
 * Pour une vraie app en production, il faudrait :
 * 1. Ajouter un champ 'normalizedUsername' lors de la création d'utilisateur
 * 2. Utiliser un service de recherche dédié (Algolia, etc.)
 */
export async function searchUsers(searchQuery: string, maxResults: number = 20): Promise<User[]> {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();

    // Récupérer un nombre limité d'utilisateurs récents
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      orderBy('createdAt', 'desc'),
      limit(100) // Limite arbitraire pour éviter de charger trop de données
    );

    const querySnapshot = await getDocs(q);
    const allUsers: User[] = querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];

    // Filtrer côté client par username ou nom
    const filteredUsers = allUsers.filter((user) => {
      const usernameMatch = user.username.toLowerCase().includes(normalizedQuery);
      const firstNameMatch = user.firstName?.toLowerCase().includes(normalizedQuery) || false;
      const lastNameMatch = user.lastName?.toLowerCase().includes(normalizedQuery) || false;
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase();
      const fullNameMatch = fullName.includes(normalizedQuery);

      return usernameMatch || firstNameMatch || lastNameMatch || fullNameMatch;
    });

    // Limiter les résultats
    const results = filteredUsers.slice(0, maxResults);

    console.log(`[Search] Trouvé ${results.length} utilisateurs pour "${searchQuery}"`);

    return results;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    throw new Error('Impossible de rechercher des utilisateurs');
  }
}

/**
 * Recherche d'utilisateurs par username exact (pour suggestions)
 */
export async function searchUsersByUsernamePrefix(
  usernamePrefix: string,
  maxResults: number = 10
): Promise<User[]> {
  return searchUsers(usernamePrefix, maxResults);
}

/**
 * Récupère des utilisateurs suggérés (par exemple, les plus récents)
 * Utile pour afficher des suggestions si la recherche est vide
 */
export async function getSuggestedUsers(maxResults: number = 10): Promise<User[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const users: User[] = querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];

    console.log(`[Search] ${users.length} utilisateurs suggérés`);

    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    return [];
  }
}
