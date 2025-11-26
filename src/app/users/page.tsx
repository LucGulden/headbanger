'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import UserCard from '@/components/UserCard';
import { searchUsers, getSuggestedUsers } from '@/lib/search';
import type { User } from '@/types/user';

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Charger les suggestions initiales
    if (user && showSuggestions) {
      loadSuggestions();
    }
  }, [user, authLoading, router, showSuggestions]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const suggestions = await getSuggestedUsers(20);
      setResults(suggestions);
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setShowSuggestions(true);
      loadSuggestions();
      return;
    }

    setShowSuggestions(false);

    try {
      setLoading(true);
      const searchResults = await searchUsers(query, 20);
      setResults(searchResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = () => {
    // Rafraîchir les résultats
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      loadSuggestions();
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-[var(--foreground)]">
            Rechercher des utilisateurs
          </h1>

          {/* Barre de recherche */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-[var(--foreground-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher par nom d'utilisateur ou nom..."
              className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-3 pl-12 pr-4 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          {showSuggestions && (
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Utilisateurs suggérés
            </p>
          )}
          {!showSuggestions && (
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              {results.length} {results.length === 1 ? 'résultat' : 'résultats'} pour "{searchQuery}"
            </p>
          )}
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[var(--background-lighter)]"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-32 rounded bg-[var(--background-lighter)]"></div>
                    <div className="h-3 w-24 rounded bg-[var(--background-lighter)]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              {showSuggestions ? 'Aucun utilisateur' : 'Aucun résultat'}
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {showSuggestions
                ? 'Il n\'y a pas encore d\'utilisateurs sur Groovr'
                : `Aucun utilisateur trouvé pour "${searchQuery}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <UserCard
                key={result.uid}
                user={result}
                showFollowButton={user.uid !== result.uid}
                onFollowChange={handleFollowChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
