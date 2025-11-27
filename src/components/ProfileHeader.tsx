import React from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import FollowButton from './FollowButton';
import type { User, ProfileStats } from '@/types/user';

interface ProfileHeaderProps {
  user: User;
  stats: ProfileStats;
  isOwnProfile: boolean;
  onFollowChange?: () => void;
}

export default function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  onFollowChange,
}: ProfileHeaderProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      {/* Cover Image - Gradient */}
      <div className="relative h-48 w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] sm:h-64">
        {/* Avatar - Overlay at bottom */}
        <div className="absolute -bottom-12 left-6 sm:-bottom-16 sm:left-8">
          <Avatar
            src={user.photoURL}
            username={user.username}
            size="xl"
            className="border-4 border-[var(--background)] ring-2 ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6 pt-16 sm:px-8 sm:pt-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* User Info */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                {user.username}
              </h1>
              {user.isPrivate && (
                <span className="flex items-center gap-1 rounded-full bg-[var(--background-lighter)] px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Privé
                </span>
              )}
            </div>

            {fullName && (
              <p className="mb-3 text-lg text-[var(--foreground-muted)]">{fullName}</p>
            )}

            {user.bio && (
              <p className="mb-4 max-w-2xl text-[var(--foreground)]">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6">
              <div>
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {stats.albumsCount}
                </span>
                <span className="ml-1 text-sm text-[var(--foreground-muted)]">albums</span>
              </div>
              <Link
                href={`/profile/${user.username}/followers`}
                className="transition-opacity hover:opacity-70"
              >
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {stats.followersCount}
                </span>
                <span className="ml-1 text-sm text-[var(--foreground-muted)]">abonnés</span>
              </Link>
              <Link
                href={`/profile/${user.username}/following`}
                className="transition-opacity hover:opacity-70"
              >
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {stats.followingCount}
                </span>
                <span className="ml-1 text-sm text-[var(--foreground-muted)]">abonnements</span>
              </Link>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {isOwnProfile ? (
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-full border-2 border-[var(--foreground-muted)] px-6 py-2 font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Modifier le profil
              </Link>
            ) : (
              <FollowButton
                targetUserId={user.uid}
                onFollowChange={onFollowChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
