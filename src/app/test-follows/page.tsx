'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowStats,
  getFollowers,
  getFollowing,
  getPendingRequests,
} from '@/lib/follows';

export default function TestFollowsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [targetUserId, setTargetUserId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  const addLog = (message: string, data?: any) => {
    setResults((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        message,
        data,
      },
    ]);
  };

  const testFollow = async () => {
    if (!targetUserId) {
      alert('Entrez un User ID cible');
      return;
    }
    setLoading(true);
    try {
      const result = await followUser(user.uid, targetUserId);
      addLog('✅ Follow créé', result);
    } catch (error: any) {
      addLog('❌ Erreur follow', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testUnfollow = async () => {
    if (!targetUserId) {
      alert('Entrez un User ID cible');
      return;
    }
    setLoading(true);
    try {
      await unfollowUser(user.uid, targetUserId);
      addLog('✅ Unfollow OK');
    } catch (error: any) {
      addLog('❌ Erreur unfollow', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testIsFollowing = async () => {
    if (!targetUserId) {
      alert('Entrez un User ID cible');
      return;
    }
    setLoading(true);
    try {
      const result = await isFollowing(user.uid, targetUserId);
      addLog('✅ Vérification follow', result);
    } catch (error: any) {
      addLog('❌ Erreur vérification', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetStats = async () => {
    setLoading(true);
    try {
      const stats = await getFollowStats(user.uid);
      addLog('✅ Stats récupérées', stats);
    } catch (error: any) {
      addLog('❌ Erreur stats', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetFollowers = async () => {
    setLoading(true);
    try {
      const followers = await getFollowers(user.uid);
      addLog('✅ Followers récupérés', { count: followers.length, followers });
    } catch (error: any) {
      addLog('❌ Erreur followers', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetFollowing = async () => {
    setLoading(true);
    try {
      const following = await getFollowing(user.uid);
      addLog('✅ Following récupérés', { count: following.length, following });
    } catch (error: any) {
      addLog('❌ Erreur following', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetPending = async () => {
    setLoading(true);
    try {
      const pending = await getPendingRequests(user.uid);
      addLog('✅ Demandes pending récupérées', { count: pending.length, pending });
    } catch (error: any) {
      addLog('❌ Erreur pending', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-[var(--foreground)]">
          🧪 Test Follows System
        </h1>

        <div className="mb-6 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4">
          <p className="mb-2 text-sm text-[var(--foreground-muted)]">
            Votre UID: <code className="rounded bg-[var(--background)] px-2 py-1">{user.uid}</code>
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Username: <code className="rounded bg-[var(--background)] px-2 py-1">{user.username}</code>
          </p>
        </div>

        {/* Input UID cible */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            User ID cible (pour tester follow/unfollow):
          </label>
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Entrez un UID d'un autre utilisateur"
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-3 text-[var(--foreground)]"
          />
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Trouvez des UIDs dans Firebase Console → Firestore → users
          </p>
        </div>

        {/* Boutons de test */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            onClick={testFollow}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Follow
          </button>
          <button
            onClick={testUnfollow}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Unfollow
          </button>
          <button
            onClick={testIsFollowing}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Is Following?
          </button>
          <button
            onClick={testGetStats}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Get Stats
          </button>
          <button
            onClick={testGetFollowers}
            disabled={loading}
            className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            Get Followers
          </button>
          <button
            onClick={testGetFollowing}
            disabled={loading}
            className="rounded-lg bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700 disabled:opacity-50"
          >
            Get Following
          </button>
          <button
            onClick={testGetPending}
            disabled={loading}
            className="rounded-lg bg-yellow-600 px-4 py-2 font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            Get Pending
          </button>
          <button
            onClick={() => setResults([])}
            className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
          >
            Clear Logs
          </button>
        </div>

        {/* Résultats */}
        <div className="rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4">
          <h2 className="mb-4 text-xl font-bold text-[var(--foreground)]">Logs:</h2>
          <div className="space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                Aucun test exécuté. Cliquez sur les boutons ci-dessus.
              </p>
            ) : (
              results.map((result, i) => (
                <div
                  key={i}
                  className="rounded border border-[var(--background-lighter)] bg-[var(--background)] p-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                    <span>{result.time}</span>
                    <span>{result.message}</span>
                  </div>
                  {result.data && (
                    <pre className="overflow-x-auto text-xs text-[var(--foreground)]">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
