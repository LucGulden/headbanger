'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';

export default function Navigation() {
  const { user, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setDropdownOpen(false);
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
          </div>
        )}

        {/* Auth buttons / User menu */}
        <div className="flex items-center gap-4">
          {loading ? (
            // Spinner pendant le chargement
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--background-lighter)]"></div>
          ) : user ? (
            // Utilisateur connecté - Avatar avec dropdown
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar src={user.photoURL} username={user.username} size="md" />
                <span className="hidden text-sm font-medium text-[var(--foreground)] md:block">
                  {user.username}
                </span>
                <svg
                  className={`h-4 w-4 text-[var(--foreground-muted)] transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-2 shadow-xl">
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Mon profil
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Paramètres
                  </Link>

                  <div className="my-1 h-px bg-[var(--background-lighter)]"></div>

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-[var(--background-lighter)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
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
