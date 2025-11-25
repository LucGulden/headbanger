import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CreateUserProfileData, UpdateUserProfileData, User } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Crée un profil utilisateur dans Firestore
 * @param uid - ID unique de l'utilisateur Firebase Auth
 * @param data - Données du profil utilisateur
 */
export async function createUserProfile(
  uid: string,
  data: CreateUserProfileData
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    await setDoc(userRef, {
      uid,
      email: data.email,
      username: data.username,
      photoURL: data.photoURL || null,
      isPrivate: data.isPrivate || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la création du profil utilisateur:', error);
    throw new Error('Impossible de créer le profil utilisateur');
  }
}

/**
 * Vérifie si un nom d'utilisateur existe déjà
 * @param username - Nom d'utilisateur à vérifier
 * @returns true si le nom d'utilisateur est disponible, false sinon
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification du nom d\'utilisateur:', error);
    throw new Error('Impossible de vérifier le nom d\'utilisateur');
  }
}

/**
 * Récupère un utilisateur par son nom d'utilisateur
 * @param username - Nom d'utilisateur à rechercher
 * @returns L'utilisateur trouvé ou null
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return userDoc.data() as User;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw new Error('Impossible de récupérer l\'utilisateur');
  }
}

/**
 * Récupère un utilisateur par son UID
 * @param uid - ID unique de l'utilisateur
 * @returns L'utilisateur trouvé ou null
 */
export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw new Error('Impossible de récupérer l\'utilisateur');
  }
}

/**
 * Met à jour le profil utilisateur
 * @param uid - ID unique de l'utilisateur
 * @param data - Données à mettre à jour
 */
export async function updateUserProfile(
  uid: string,
  data: UpdateUserProfileData
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw new Error('Impossible de mettre à jour le profil');
  }
}

/**
 * Valide le format d'un nom d'utilisateur
 * @param username - Nom d'utilisateur à valider
 * @returns true si valide, false sinon
 */
export function validateUsername(username: string): boolean {
  // Alphanumerique + tirets/underscores, 3-20 caractères
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}
