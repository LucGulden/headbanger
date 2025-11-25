'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Button from '@/components/Button';

export default function FeedPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Protection de la route : rediriger vers /login si non authentifié
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  // Ne rien afficher si l'utilisateur n'est pas connecté (redirection en cours)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-[var(--foreground)]">
            Bienvenue,{' '}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              {user.username}
            </span>
            !
          </h1>
          <p className="text-lg text-[var(--foreground-muted)]">
            Vous êtes maintenant connecté à Groovr
          </p>
        </div>

        {/* Card avec informations */}
        <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-8">
          <div className="mb-6 flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.username}
                className="h-20 w-20 rounded-full border-4 border-[var(--primary)]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)] text-3xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {user.username}
              </h2>
              <p className="text-[var(--foreground-muted)]">{user.email}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--background-lighter)] bg-[var(--background)] p-6">
            <h3 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
              Authentification réussie !
            </h3>
            <p className="mb-4 text-[var(--foreground-muted)]">
              Votre système d'authentification fonctionne correctement. Cette page est protégée
              et accessible uniquement aux utilisateurs connectés.
            </p>
            <p className="text-[var(--foreground-muted)]">
              Le vrai feed social avec posts, likes et commentaires sera implémenté dans la Phase 7.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="sm:w-auto"
            >
              Se déconnecter
            </Button>
          </div>
        </div>

        {/* Features à venir */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6">
            <div className="mb-3 text-4xl">📝</div>
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">Posts</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              À venir : Partagez vos vinyles et vos écoutes
            </p>
          </div>
          <div className="rounded-xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6">
            <div className="mb-3 text-4xl">❤️</div>
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">Interactions</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              À venir : Likez et commentez les posts
            </p>
          </div>
          <div className="rounded-xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6">
            <div className="mb-3 text-4xl">👥</div>
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">Communauté</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              À venir : Suivez d'autres collectionneurs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
