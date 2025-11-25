'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ProfileHeader from '@/components/ProfileHeader';
import { getUserByUsername, getProfileStats } from '@/lib/user';
import type { User, ProfileStats } from '@/types/user';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();

  const username = params.username as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ albumsCount: 0, followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'collection' | 'wishlist'>('collection');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Récupérer l'utilisateur par username
        const user = await getUserByUsername(username);

        if (!user) {
          notFound();
          return;
        }

        setProfileUser(user);

        // Récupérer les stats
        const userStats = await getProfileStats(user.uid);
        setStats(userStats);
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

  const handleFollowClick = () => {
    // TODO: Implémenter la logique de follow (Phase ultérieure)
    console.log('Follow clicked');
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Profile Header */}
      <ProfileHeader
        user={profileUser}
        stats={stats}
        isOwnProfile={isOwnProfile}
        onFollowClick={handleFollowClick}
      />

      {/* Tabs */}
      <div className="border-b border-[var(--background-lighter)]">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('collection')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'collection'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Collection
              {activeTab === 'collection' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'wishlist'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Wishlist
              {activeTab === 'wishlist' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        {activeTab === 'collection' && (
          <div className="text-center">
            <div className="mb-4 text-6xl">💿</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              Aucun album pour le moment
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {isOwnProfile
                ? 'Commencez à ajouter des vinyles à votre collection'
                : `${profileUser.username} n'a pas encore ajouté de vinyles`}
            </p>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="text-center">
            <div className="mb-4 text-6xl">⭐</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              Wishlist vide
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {isOwnProfile
                ? 'Ajoutez des vinyles que vous souhaitez acquérir'
                : `${profileUser.username} n'a pas encore de wishlist`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
