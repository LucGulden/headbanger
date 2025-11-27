'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { followUser, unfollowUser, isFollowing } from '@/lib/follows';
import Button from './Button';
import type { FollowCheckResult } from '@/types/follows';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: () => void; // Callback pour rafraîchir les stats
}

export default function FollowButton({
  targetUserId,
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [followState, setFollowState] = useState<FollowCheckResult>({ isFollowing: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Charger l'état initial du follow
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const result = await isFollowing(user.uid, targetUserId);
        setFollowState(result);
      } catch (error) {
        console.error('Erreur lors de la vérification du follow:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleToggleFollow = async () => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(true);

      if (followState.isFollowing) {
        // Unfollow
        await unfollowUser(user.uid, targetUserId);
        setFollowState({ isFollowing: false });
      } else {
        // Follow
        const result = await followUser(user.uid, targetUserId);
        setFollowState({
          isFollowing: true,
          status: result.status,
          followId: result.id,
        });
      }

      // Notifier le parent pour rafraîchir les stats
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('Erreur lors du toggle follow:', error);
      alert(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Ne pas afficher le bouton pour soi-même
  if (user.uid === targetUserId) {
    return null;
  }

  // Loading initial
  if (loading) {
    return (
      <Button variant="outline" disabled>
        <div className="h-4 w-16 animate-pulse rounded bg-[var(--background-lighter)]"></div>
      </Button>
    );
  }

  // États du bouton selon le statut
  if (followState.isFollowing) {
    if (followState.status === 'pending') {
      // En attente d'acceptation
      return (
        <Button
          onClick={handleToggleFollow}
          loading={actionLoading}
          variant="outline"
          className="border-orange-500/30 text-orange-500 hover:border-orange-500 hover:bg-orange-500/10"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            En attente
          </span>
        </Button>
      );
    } else {
      // Abonné (accepted)
      return (
        <Button
          onClick={handleToggleFollow}
          loading={actionLoading}
          variant="outline"
          className="border-green-500/30 text-green-500 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="group-hover:hidden">Abonné</span>
            <span className="hidden group-hover:inline">Se désabonner</span>
          </span>
        </Button>
      );
    }
  }

  // Pas encore suivi
  return (
    <Button
      onClick={handleToggleFollow}
      loading={actionLoading}
      variant="primary"
    >
      <span className="flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Suivre
      </span>
    </Button>
  );
}
