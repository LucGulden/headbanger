import { Timestamp } from 'firebase/firestore';

/**
 * Interface représentant un utilisateur dans l'application
 */
export interface User {
  uid: string;
  email: string;
  username: string;
  photoURL?: string;
  isPrivate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Données nécessaires pour l'inscription
 */
export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

/**
 * Données nécessaires pour la connexion
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * Type pour les erreurs d'authentification
 */
export type AuthError = {
  code: string;
  message: string;
};

/**
 * Données pour créer un profil utilisateur dans Firestore
 */
export interface CreateUserProfileData {
  email: string;
  username: string;
  photoURL?: string;
  isPrivate?: boolean;
}

/**
 * Données pour mettre à jour un profil utilisateur
 */
export interface UpdateUserProfileData {
  username?: string;
  photoURL?: string;
  isPrivate?: boolean;
}
