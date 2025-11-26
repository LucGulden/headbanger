import { Timestamp } from 'firebase/firestore';

/**
 * Statut d'un follow
 */
export type FollowStatus = 'pending' | 'accepted';

/**
 * Relation de follow entre deux utilisateurs
 * Document dans Firestore : /follows/{id}
 */
export interface Follow {
  id: string; // ID Firestore du document
  followerId: string; // ID de l'utilisateur qui suit
  followingId: string; // ID de l'utilisateur suivi
  status: FollowStatus; // 'pending' si compte privé, 'accepted' sinon
  createdAt: Timestamp; // Date de création du follow
}

/**
 * Statistiques de follow d'un utilisateur
 */
export interface FollowStats {
  followersCount: number; // Nombre d'abonnés (accepted)
  followingCount: number; // Nombre d'abonnements (accepted)
}

/**
 * Résultat de vérification de follow
 */
export interface FollowCheckResult {
  isFollowing: boolean;
  status?: FollowStatus;
  followId?: string; // ID du document follow si existe
}
