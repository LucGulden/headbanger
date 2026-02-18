import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { followUser, unfollowUser, isFollowing } from '../lib/api/follows'
import { useAuth } from '../hooks/useAuth'
import { getHueFromString } from '../utils/hue'
import type { User } from '@headbanger/shared'

interface ProfileStats {
  releasesCount: number
  wishlistCount?: number
  followersCount: number
  followingCount: number
}

interface ProfileHeaderProps {
  user: User
  stats: ProfileStats
  isOwnProfile: boolean
  onFollowChange?: () => void
}

export default function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  onFollowChange,
}: ProfileHeaderProps) {
  const { user: currentUser } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const avatarHue = getHueFromString(user.username)

  useEffect(() => {
    if (!currentUser || isOwnProfile) return
    const checkFollowing = async () => {
      try {
        const result = await isFollowing(user.uid)
        setFollowing(result)
      } catch (error) {
        console.error('Erreur lors de la vérification du follow:', error)
      }
    }
    checkFollowing()
  }, [currentUser, user.uid, isOwnProfile])

  const handleFollowToggle = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      if (following) {
        await unfollowUser(user.uid)
        setFollowing(false)
      } else {
        await followUser(user.uid)
        setFollowing(true)
      }
      onFollowChange?.()
    } catch (error) {
      console.error('Erreur lors du follow/unfollow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Cover Banner */}
      <div className="profile__cover">
        <div className="profile__cover-bg" aria-hidden="true">
          <div className="profile__cover-grain" />
          <div className="profile__cover-glow profile__cover-glow--1" />
          <div className="profile__cover-glow profile__cover-glow--2" />
          <div className="profile__cover-grooves" />
        </div>
      </div>

      {/* Header */}
      <div className="profile__header">
        <div className="profile__header-inner">
          {/* Avatar */}
          <div className="profile__avatar-wrap anim-fade" data-delay="0">
            <div className="profile__avatar">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg
                  className="profile__avatar-placeholder"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect width="120" height="120" rx="60" fill="#1e1e26" />
                  <circle cx="60" cy="46" r="20" fill="#2a2a35" />
                  <ellipse cx="60" cy="95" rx="32" ry="22" fill="#2a2a35" />
                  <text
                    x="60"
                    y="56"
                    textAnchor="middle"
                    fill={`hsl(${avatarHue}, 65%, 55%)`}
                    fontFamily="'Clash Display', sans-serif"
                    fontWeight="600"
                    fontSize="28"
                  >
                    {initials}
                  </text>
                </svg>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="profile__info anim-fade" data-delay="1">
            <div className="profile__name-row">
              <h1 className="profile__name">{displayName}</h1>
              {!isOwnProfile && currentUser && (
                <button
                  className={`profile__follow-btn btn ${following ? 'btn--ghost' : 'btn--primary'}`}
                  onClick={handleFollowToggle}
                  disabled={loading}
                >
                  {following ? (
                    <>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <polyline points="3,8 7,12 13,4" />
                      </svg>
                      Following
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <line x1="8" y1="3" x2="8" y2="13" />
                        <line x1="3" y1="8" x2="13" y2="8" />
                      </svg>
                      Follow
                    </>
                  )}
                </button>
              )}
              {isOwnProfile && (
                <Link to="/settings" className="profile__follow-btn btn btn--ghost">
                  Edit profile
                </Link>
              )}
            </div>
            <span className="profile__username">@{user.username}</span>
            {user.bio && <p className="profile__bio">{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="profile__stats anim-fade" data-delay="2">
            <Link to={`/profile/${user.username}/followers`} className="profile__stat">
              <span className="profile__stat-number">{stats.followersCount.toLocaleString()}</span>
              <span className="profile__stat-label">Followers</span>
            </Link>
            <div className="profile__stat-divider" />
            <Link to={`/profile/${user.username}/following`} className="profile__stat">
              <span className="profile__stat-number">{stats.followingCount.toLocaleString()}</span>
              <span className="profile__stat-label">Following</span>
            </Link>
            <div className="profile__stat-divider" />
            <div className="profile__stat">
              <span className="profile__stat-number">{stats.releasesCount.toLocaleString()}</span>
              <span className="profile__stat-label">Collection</span>
            </div>
            {stats.wishlistCount !== undefined && (
              <>
                <div className="profile__stat-divider" />
                <div className="profile__stat">
                  <span className="profile__stat-number">
                    {stats.wishlistCount.toLocaleString()}
                  </span>
                  <span className="profile__stat-label">Wishlist</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
