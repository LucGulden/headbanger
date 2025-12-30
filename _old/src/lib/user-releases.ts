import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { getReleaseById } from './releases';
import { createPost } from './posts';
import type {
  UserRelease,
  UserReleaseWithDetails,
  CollectionType,
} from '@/types/collection';

const USER_RELEASES_COLLECTION = 'user_releases';

/**
 * Ajoute un vinyle à la collection d'un utilisateur
 */
export async function addToCollection(
  userId: string,
  releaseId: string,
  notes?: string
): Promise<UserRelease> {
  try {
    console.log('adding to collection')
    // Vérifier si déjà dans la collection
    const existing = await getUserReleaseByReleaseId(userId, releaseId, 'collection');
    if (existing) {
      console.log(`Vinyle déjà dans la collection`);
      return existing;
    }

    // Créer le document
    const newDocRef = doc(collection(db, USER_RELEASES_COLLECTION));
    const userReleaseData = {
      userId,
      releaseId,
      type: 'collection' as CollectionType,
      notes: notes || null,
      addedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, userReleaseData);

    // Créer automatiquement un post pour partager l'ajout
    try {
      await createPost(userId, 'collection_add', releaseId);
    } catch (postError) {
      console.error('Erreur lors de la création du post:', postError);
      // Ne pas faire échouer l'ajout si la création du post échoue
    }

    return {
      id: newDocRef.id,
      ...userReleaseData,
      addedAt: userReleaseData.addedAt,
    } as UserRelease;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la collection:', error);
    throw new Error('Impossible d\'ajouter le vinyle à la collection');
  }
}

/**
 * Ajoute un vinyle à la wishlist d'un utilisateur
 */
export async function addToWishlist(
  userId: string,
  releaseId: string,
  notes?: string
): Promise<UserRelease> {
  try {
    // Vérifier si déjà dans la wishlist
    const existing = await getUserReleaseByReleaseId(userId, releaseId, 'wishlist');
    if (existing) {
      console.log(`Vinyle déjà dans la wishlist`);
      return existing;
    }

    const newDocRef = doc(collection(db, USER_RELEASES_COLLECTION));
    const userReleaseData = {
      userId,
      releaseId,
      type: 'wishlist' as CollectionType,
      notes: notes || null,
      addedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, userReleaseData);

    // Créer automatiquement un post pour partager l'ajout
    try {
      await createPost(userId, 'wishlist_add', releaseId);
    } catch (postError) {
      console.error('Erreur lors de la création du post:', postError);
      // Ne pas faire échouer l'ajout si la création du post échoue
    }

    return {
      id: newDocRef.id,
      ...userReleaseData,
      addedAt: userReleaseData.addedAt,
    } as UserRelease;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la wishlist:', error);
    throw new Error('Impossible d\'ajouter le vinyle à la wishlist');
  }
}

/**
 * Supprime un vinyle de la collection
 */
export async function removeFromCollection(
  userId: string,
  releaseId: string
): Promise<void> {
  try {
    const userRelease = await getUserReleaseByReleaseId(userId, releaseId, 'collection');
    if (!userRelease) {
      console.log(`Vinyle non trouvé dans la collection`);
      return;
    }

    const docRef = doc(db, USER_RELEASES_COLLECTION, userRelease.id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la collection:', error);
    throw new Error('Impossible de supprimer le vinyle de la collection');
  }
}

/**
 * Supprime un vinyle de la wishlist
 */
export async function removeFromWishlist(
  userId: string,
  releaseId: string
): Promise<void> {
  try {
    const userRelease = await getUserReleaseByReleaseId(userId, releaseId, 'wishlist');
    if (!userRelease) {
      console.log(`Vinyle non trouvé dans la wishlist`);
      return;
    }

    const docRef = doc(db, USER_RELEASES_COLLECTION, userRelease.id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la wishlist:', error);
    throw new Error('Impossible de supprimer le vinyle de la wishlist');
  }
}

/**
 * Déplace un vinyle de la wishlist vers la collection
 */
export async function moveToCollection(
  userId: string,
  releaseId: string
): Promise<void> {
  try {
    const wishlistItem = await getUserReleaseByReleaseId(userId, releaseId, 'wishlist');
    if (!wishlistItem) {
      throw new Error('Vinyle non trouvé dans la wishlist');
    }

    // Supprimer de la wishlist
    await removeFromWishlist(userId, releaseId);

    // Ajouter à la collection
    await addToCollection(userId, releaseId, wishlistItem.notes);
  } catch (error) {
    console.error('Erreur lors du déplacement vers la collection:', error);
    throw new Error('Impossible de déplacer le vinyle vers la collection');
  }
}

/**
 * Récupère la collection d'un utilisateur avec les détails des releases
 */
export async function getUserCollection(
  userId: string
): Promise<UserReleaseWithDetails[]> {
  try {
    const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);
    const q = query(
      userReleasesRef,
      where('userId', '==', userId),
      where('type', '==', 'collection'),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const userReleases: UserRelease[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserRelease[];

    // Récupérer les détails de chaque vinyle
    const releasesWithDetails = await Promise.all(
      userReleases.map(async (userRelease) => {
        const release = await getReleaseById(userRelease.releaseId);
        if (!release) {
          console.warn(`Vinyle ${userRelease.releaseId} non trouvé`);
          return null;
        }
        return {
          ...userRelease,
          release,
        } as UserReleaseWithDetails;
      })
    );

    return releasesWithDetails.filter((item): item is UserReleaseWithDetails => item !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération de la collection:', error);
    throw new Error('Impossible de récupérer la collection');
  }
}

/**
 * Récupère la wishlist d'un utilisateur avec les détails des releases
 */
export async function getUserWishlist(
  userId: string
): Promise<UserReleaseWithDetails[]> {
  try {
    const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);
    const q = query(
      userReleasesRef,
      where('userId', '==', userId),
      where('type', '==', 'wishlist'),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const userReleases: UserRelease[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserRelease[];

    // Récupérer les détails de chaque vinyle
    const releasesWithDetails = await Promise.all(
      userReleases.map(async (userRelease) => {
        const release = await getReleaseById(userRelease.releaseId);
        if (!release) {
          console.warn(`Vinyle ${userRelease.releaseId} non trouvé`);
          return null;
        }
        return {
          ...userRelease,
          release,
        } as UserReleaseWithDetails;
      })
    );

    return releasesWithDetails.filter((item): item is UserReleaseWithDetails => item !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération de la wishlist:', error);
    throw new Error('Impossible de récupérer la wishlist');
  }
}

/**
 * Vérifie si un vinyle est dans la collection d'un utilisateur
 */
export async function isInCollection(
  userId: string,
  releaseId: string
): Promise<boolean> {
  try {
    const userRelease = await getUserReleaseByReleaseId(userId, releaseId, 'collection');
    return userRelease !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de la collection:', error);
    return false;
  }
}

/**
 * Vérifie si un vinyle est dans la wishlist d'un utilisateur
 */
export async function isInWishlist(
  userId: string,
  releaseId: string
): Promise<boolean> {
  try {
    const userRelease = await getUserReleaseByReleaseId(userId, releaseId, 'wishlist');
    return userRelease !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de la wishlist:', error);
    return false;
  }
}

/**
 * Subscribe aux changements de la collection (real-time)
 */
export function subscribeToUserCollection(
  userId: string,
  onUpdate: (releases: UserReleaseWithDetails[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);
  const q = query(
    userReleasesRef,
    where('userId', '==', userId),
    where('type', '==', 'collection'),
    orderBy('addedAt', 'desc')
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const userReleases: UserRelease[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserRelease[];

        const releasesWithDetails = await Promise.all(
          userReleases.map(async (userRelease) => {
            const release = await getReleaseById(userRelease.releaseId);
            if (!release) return null;
            return { ...userRelease, release } as UserReleaseWithDetails;
          })
        );

        const filtered = releasesWithDetails.filter(
          (item): item is UserReleaseWithDetails => item !== null
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
 * Subscribe aux changements de la wishlist (real-time)
 */
export function subscribeToUserWishlist(
  userId: string,
  onUpdate: (releases: UserReleaseWithDetails[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);
  const q = query(
    userReleasesRef,
    where('userId', '==', userId),
    where('type', '==', 'wishlist'),
    orderBy('addedAt', 'desc')
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const userReleases: UserRelease[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserRelease[];

        const releasesWithDetails = await Promise.all(
          userReleases.map(async (userRelease) => {
            const release = await getReleaseById(userRelease.releaseId);
            if (!release) return null;
            return { ...userRelease, release } as UserReleaseWithDetails;
          })
        );

        const filtered = releasesWithDetails.filter(
          (item): item is UserReleaseWithDetails => item !== null
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
 * Récupère une page d'releases avec pagination
 * Pour Collection ou Wishlist
 */
export async function getUserReleasesPaginated(
  userId: string,
  type: CollectionType,
  limitCount: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ releases: UserReleaseWithDetails[], lastDoc: DocumentSnapshot | null }> {
  try {
    const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);

    let q = query(
      userReleasesRef,
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('addedAt', 'desc'),
      limit(limitCount)
    );

    // Pagination: démarrer après le dernier document
    if (lastDoc) {
      q = query(
        userReleasesRef,
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('addedAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { releases: [], lastDoc: null };
    }

    const userReleases: UserRelease[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserRelease[];

    // Récupérer les détails de chaque vinyle
    const releasesWithDetails = await Promise.all(
      userReleases.map(async (userRelease) => {
        const release = await getReleaseById(userRelease.releaseId);
        if (!release) {
          console.warn(`Vinyle ${userRelease.releaseId} non trouvé`);
          return null;
        }
        return {
          ...userRelease,
          release,
        } as UserReleaseWithDetails;
      })
    );

    const filtered = releasesWithDetails.filter((item): item is UserReleaseWithDetails => item !== null);
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { releases: filtered, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Erreur lors de la récupération paginée:', error);
    throw new Error('Impossible de récupérer les releases');
  }
}

/**
 * Compte le nombre total d'releases (collection ou wishlist)
 */
export async function countUserReleases(
  userId: string,
  type: CollectionType
): Promise<number> {
  try {
    const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);
    const q = query(
      userReleasesRef,
      where('userId', '==', userId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erreur lors du comptage des releases:', error);
    return 0;
  }
}

/**
 * Helper: Récupère un UserRelease par releaseId et type
 */
async function getUserReleaseByReleaseId(
  userId: string,
  releaseId: string,
  type: CollectionType
): Promise<UserRelease | null> {
  try {
    const userReleasesRef = collection(db, USER_RELEASES_COLLECTION);
    const q = query(
      userReleasesRef,
      where('userId', '==', userId),
      where('releaseId', '==', releaseId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as UserRelease;
  } catch (error) {
    console.error('Erreur lors de la récupération du UserRelease:', error);
    return null;
  }
}
