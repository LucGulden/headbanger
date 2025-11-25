'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Navigation() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--background-lighter)] bg-[var(--background)]/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
          <span>🎵</span>
          <span className="text-[var(--foreground)]">Groovr</span>
        </Link>

        {/* Navigation links - Desktop - Affichés seulement si connecté */}
        {user && (
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/feed"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Feed
            </Link>
            <Link
              href="/collection"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Collection
            </Link>
            <Link
              href="/wishlist"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Wishlist
            </Link>
            <Link
              href={`/profil/${user.username}`}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Profil
            </Link>
          </div>
        )}

        {/* Auth buttons / User menu */}
        <div className="flex items-center gap-4">
          {loading ? (
            // Spinner pendant le chargement
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--background-lighter)]"></div>
          ) : user ? (
            // Utilisateur connecté
            <>
              <div className="hidden items-center gap-3 md:flex">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.username}
                    className="h-10 w-10 rounded-full border-2 border-[var(--primary)]"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-lg font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {user.username}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-[var(--background-lighter)] px-6 py-2 font-medium text-[var(--foreground)] hover:bg-[var(--background-lighter)]/80"
              >
                Déconnexion
              </button>
            </>
          ) : (
            // Utilisateur non connecté
            <>
              <Link
                href="/login"
                className="hidden text-[var(--foreground-muted)] hover:text-[var(--foreground)] md:block"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[var(--primary)] px-6 py-2 font-medium text-white hover:bg-[#d67118]"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
