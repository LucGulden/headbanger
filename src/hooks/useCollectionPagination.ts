import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { getUserReleasesPaginated, countUserReleases } from '@/lib/user-releases';
import type { UserReleaseWithDetails, CollectionType } from '@/types/collection';

const INITIAL_LOAD_COUNT = 20;
const LOAD_MORE_COUNT = 15;

export interface UseCollectionPaginationProps {
  userId: string;
  type: CollectionType;
  initialLimit?: number;
  loadMoreLimit?: number;
}

export interface UseCollectionPaginationReturn {
  releases: UserReleaseWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  removeReleaseFromList: (releaseId: string) => void;
}

/**
 * Hook personnalisé pour gérer la pagination des collections/wishlists
 * - Chargement initial : 20 releases
 * - Load more : 15 releases à la fois
 * - Curseur Firestore (lastVisible document)
 */
export function useCollectionPagination({
  userId,
  type,
  initialLimit = INITIAL_LOAD_COUNT,
  loadMoreLimit = LOAD_MORE_COUNT,
}: UseCollectionPaginationProps): UseCollectionPaginationReturn {
  const [releases, setReleases] = useState<UserReleaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  /**
   * Charge le nombre total d'releases
   */
  const fetchTotal = useCallback(async () => {
    try {
      const count = await countUserReleases(userId, type);
      setTotal(count);
    } catch (err) {
      console.error('Erreur lors du comptage:', err);
    }
  }, [userId, type]);

  /**
   * Charge les premiers releases (20 releases)
   */
  const fetchInitialReleases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { releases: initialReleases, lastDoc: newLastDoc } = await getUserReleasesPaginated(
        userId,
        type,
        initialLimit
      );

      setReleases(initialReleases);
      setLastDoc(newLastDoc);
      setHasMore(initialReleases.length === initialLimit);

      // Charger le total en parallèle
      await fetchTotal();
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, type, initialLimit, fetchTotal]);

  /**
   * Charge 15 releases supplémentaires
   */
  const loadMoreReleases = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);

    try {
      const { releases: moreReleases, lastDoc: newLastDoc } = await getUserReleasesPaginated(
        userId,
        type,
        loadMoreLimit,
        lastDoc
      );

      if (moreReleases.length === 0) {
        setHasMore(false);
      } else {
        setReleases((prev) => [...prev, ...moreReleases]);
        setLastDoc(newLastDoc);
        setHasMore(moreReleases.length === loadMoreLimit);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus d\'releases:', err);
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  };

  /**
   * Rafraîchit la liste complète
   */
  const refreshReleases = async () => {
    setLoading(true);
    setError(null);

    try {
      const { releases: initialReleases, lastDoc: newLastDoc } = await getUserReleasesPaginated(
        userId,
        type,
        initialLimit
      );

      setReleases(initialReleases);
      setLastDoc(newLastDoc);
      setHasMore(initialReleases.length === initialLimit);

      // Rafraîchir le total
      await fetchTotal();
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un release de la liste locale (après suppression Firestore)
   */
  const removeReleaseFromList = useCallback((releaseId: string) => {
    setReleases((prev) => prev.filter((release) => release.releaseId !== releaseId));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchInitialReleases();
  }, [fetchInitialReleases]);

  return {
    releases,
    loading,
    loadingMore,
    hasMore,
    error,
    total,
    loadMore: loadMoreReleases,
    refresh: refreshReleases,
    removeReleaseFromList,
  };
}
