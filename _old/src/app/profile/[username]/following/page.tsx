'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import UserCard from '@/components/UserCard';
import { getUserByUsername } from '@/lib/user';
import { getFollowing } from '@/lib/follows';
import type { User } from '@/types/user';

export default function FollowingPage() {
  const params = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const username = params.username as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur par username
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const user = await getUserByUsername(username);

        if (!user) {
          notFound();
          return;
        }

        setProfileUser(user);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Charger les abonnements
  useEffect(() => {
    const loadFollowing = async () => {
      if (!profileUser) return;

      try {
        setLoading(true);
        const followingList = await getFollowing(profileUser.uid);
        setFollowing(followingList);
      } catch (error) {
        console.error('Erreur lors du chargement des abonnements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [profileUser]);

  const handleFollowChange = () => {
    // Rafraîchir la liste des abonnements
    if (profileUser) {
      getFollowing(profileUser.uid).then(setFollowing);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!profileUser) {
    notFound();
    return null;
  }

  const isOwnProfile = currentUser?.uid === profileUser.uid;

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/profile/${username}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour au profil
          </Link>

          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Abonnements de {profileUser.username}
          </h1>
          <p className="mt-2 text-[var(--foreground-muted)]">
            {following.length} {following.length === 1 ? 'abonnement' : 'abonnements'}
          </p>
        </div>

        {/* Liste des abonnements */}
        {following.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">👥</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              Aucun abonnement
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {isOwnProfile
                ? 'Vous ne suivez personne pour le moment'
                : `${profileUser.username} ne suit personne pour le moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((user) => (
              <UserCard
                key={user.uid}
                user={user}
                showFollowButton={!isOwnProfile && currentUser?.uid !== user.uid}
                onFollowChange={handleFollowChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
