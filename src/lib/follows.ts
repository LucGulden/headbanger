import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserByUid } from './user';
import type { Follow, FollowStatus, FollowCheckResult, FollowStats } from '@/types/follows';
import type { User } from '@/types/user';

const FOLLOWS_COLLECTION = 'follows';

/**
 * Suivre un utilisateur
 * Si l'utilisateur est privé, le statut sera 'pending'
 * Sinon, le statut sera 'accepted'
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<Follow> {
  try {
    // Vérifier qu'on ne se suit pas soi-même
    if (followerId === followingId) {
      throw new Error('Vous ne pouvez pas vous suivre vous-même');
    }

    // Vérifier si le follow existe déjà
    const existing = await getFollowDoc(followerId, followingId);
    if (existing) {
      console.log('Follow déjà existant');
      return existing;
    }

    // Récupérer l'utilisateur à suivre pour vérifier s'il est privé
    const targetUser = await getUserByUid(followingId);
    if (!targetUser) {
      throw new Error('Utilisateur introuvable');
    }

    // Déterminer le statut selon si le compte est privé
    const status: FollowStatus = targetUser.isPrivate ? 'pending' : 'accepted';

    // Créer le document de follow
    const newFollowRef = doc(collection(db, FOLLOWS_COLLECTION));
    const followData = {
      followerId,
      followingId,
      status,
      createdAt: serverTimestamp(),
    };

    await setDoc(newFollowRef, followData);

    console.log(`[Follow] ${followerId} → ${followingId} (${status})`);

    return {
      id: newFollowRef.id,
      ...followData,
      createdAt: followData.createdAt as any,
    } as Follow;
  } catch (error) {
    console.error('Erreur lors du follow:', error);
    throw new Error('Impossible de suivre cet utilisateur');
  }
}

/**
 * Ne plus suivre un utilisateur
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  try {
    const follow = await getFollowDoc(followerId, followingId);
    if (!follow) {
      console.log('Follow non trouvé');
      return;
    }

    const followRef = doc(db, FOLLOWS_COLLECTION, follow.id);
    await deleteDoc(followRef);

    console.log(`[Unfollow] ${followerId} X ${followingId}`);
  } catch (error) {
    console.error('Erreur lors du unfollow:', error);
    throw new Error('Impossible de ne plus suivre cet utilisateur');
  }
}

/**
 * Accepter une demande de follow
 * Seulement possible si on est l'utilisateur suivi (followingId)
 */
export async function acceptFollowRequest(
  followerId: string,
  followingId: string
): Promise<void> {
  try {
    const follow = await getFollowDoc(followerId, followingId);
    if (!follow) {
      throw new Error('Demande de follow introuvable');
    }

    if (follow.status === 'accepted') {
      console.log('Demande déjà acceptée');
      return;
    }

    const followRef = doc(db, FOLLOWS_COLLECTION, follow.id);
    await updateDoc(followRef, {
      status: 'accepted',
    });

    console.log(`[Accept] ${followerId} → ${followingId}`);
  } catch (error) {
    console.error('Erreur lors de l\'acceptation:', error);
    throw new Error('Impossible d\'accepter cette demande');
  }
}

/**
 * Refuser une demande de follow
 * Supprime simplement le document
 */
export async function rejectFollowRequest(
  followerId: string,
  followingId: string
): Promise<void> {
  try {
    await unfollowUser(followerId, followingId);
    console.log(`[Reject] ${followerId} X ${followingId}`);
  } catch (error) {
    console.error('Erreur lors du refus:', error);
    throw new Error('Impossible de refuser cette demande');
  }
}

/**
 * Récupère la liste des abonnés d'un utilisateur (accepted seulement)
 */
export async function getFollowers(userId: string): Promise<User[]> {
  try {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    const q = query(
      followsRef,
      where('followingId', '==', userId),
      where('status', '==', 'accepted'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const follows: Follow[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Follow[];

    // Récupérer les infos des followers
    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await getUserByUid(follow.followerId);
        return user;
      })
    );

    return followers.filter((user): user is User => user !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération des followers:', error);
    throw new Error('Impossible de récupérer les abonnés');
  }
}

/**
 * Récupère la liste des abonnements d'un utilisateur (accepted seulement)
 */
export async function getFollowing(userId: string): Promise<User[]> {
  try {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    const q = query(
      followsRef,
      where('followerId', '==', userId),
      where('status', '==', 'accepted'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const follows: Follow[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Follow[];

    // Récupérer les infos des utilisateurs suivis
    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await getUserByUid(follow.followingId);
        return user;
      })
    );

    return following.filter((user): user is User => user !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération des following:', error);
    throw new Error('Impossible de récupérer les abonnements');
  }
}

/**
 * Récupère les demandes de follow en attente pour un utilisateur
 * (demandes reçues par cet utilisateur)
 */
export async function getPendingRequests(userId: string): Promise<(Follow & { user: User })[]> {
  try {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    const q = query(
      followsRef,
      where('followingId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const follows: Follow[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Follow[];

    // Récupérer les infos des utilisateurs qui demandent à follow
    const requests = await Promise.all(
      follows.map(async (follow) => {
        const user = await getUserByUid(follow.followerId);
        if (!user) return null;
        return {
          ...follow,
          user,
        };
      })
    );

    return requests.filter((req): req is Follow & { user: User } => req !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    throw new Error('Impossible de récupérer les demandes');
  }
}

/**
 * Vérifie si un utilisateur suit un autre
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<FollowCheckResult> {
  try {
    const follow = await getFollowDoc(followerId, followingId);

    if (!follow) {
      return { isFollowing: false };
    }

    return {
      isFollowing: true,
      status: follow.status,
      followId: follow.id,
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du follow:', error);
    return { isFollowing: false };
  }
}

/**
 * Récupère les statistiques de follow d'un utilisateur
 */
export async function getFollowStats(userId: string): Promise<FollowStats> {
  try {
    const followsRef = collection(db, FOLLOWS_COLLECTION);

    // Compter les followers (accepted)
    const followersQuery = query(
      followsRef,
      where('followingId', '==', userId),
      where('status', '==', 'accepted')
    );
    const followersSnapshot = await getDocs(followersQuery);
    const followersCount = followersSnapshot.size;

    // Compter les following (accepted)
    const followingQuery = query(
      followsRef,
      where('followerId', '==', userId),
      where('status', '==', 'accepted')
    );
    const followingSnapshot = await getDocs(followingQuery);
    const followingCount = followingSnapshot.size;

    return {
      followersCount,
      followingCount,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return {
      followersCount: 0,
      followingCount: 0,
    };
  }
}

/**
 * Subscribe aux demandes de follow en attente (real-time)
 */
export function subscribeToPendingRequests(
  userId: string,
  onUpdate: (requests: (Follow & { user: User })[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const followsRef = collection(db, FOLLOWS_COLLECTION);
  const q = query(
    followsRef,
    where('followingId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const follows: Follow[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Follow[];

        const requests = await Promise.all(
          follows.map(async (follow) => {
            const user = await getUserByUid(follow.followerId);
            if (!user) return null;
            return { ...follow, user };
          })
        );

        const filtered = requests.filter(
          (req): req is Follow & { user: User } => req !== null
        );
        onUpdate(filtered);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Helper: Récupère un document de follow par followerId et followingId
 */
async function getFollowDoc(
  followerId: string,
  followingId: string
): Promise<Follow | null> {
  try {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    const q = query(
      followsRef,
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Follow;
  } catch (error) {
    console.error('Erreur lors de la récupération du follow:', error);
    return null;
  }
}
