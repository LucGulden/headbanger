'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import EditProfileForm from '@/components/EditProfileForm';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Protection de la route : rediriger vers /login si non authentifié
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSuccess = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      // Rafraîchir la page pour voir les changements
      window.location.reload();
    }, 2000);
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
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
              Paramètres du profil
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Modifiez vos informations personnelles et vos préférences
            </p>
          </div>
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-2 rounded-full border-2 border-[var(--foreground-muted)] px-6 py-2 font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Voir mon profil
          </Link>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-8">
          <EditProfileForm user={user} onSuccess={handleSuccess} />
        </div>

        {/* Toast de succès */}
        {showSuccessToast && (
          <div className="fixed bottom-8 right-8 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-6 py-4 shadow-lg">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-green-500">Profil mis à jour !</p>
              <p className="text-sm text-green-500/80">Vos modifications ont été enregistrées</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
