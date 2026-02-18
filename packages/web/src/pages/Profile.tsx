import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserStore } from '../stores/userStore'
import ProfileHeader from '../components/ProfileHeader'
import ProfileVinyls from '../components/ProfileVinyls'
import Feed from '../components/Feed'
import { getFollowStats } from '../lib/api/follows'
import { getVinylStats } from '../lib/api/userVinyls'
import { getUserByUsername } from '../lib/api/users'
import { useAnimFade } from '../hooks/useAnimFade'
import type { User } from '@headbanger/shared'
import '../styles/profile.css'

type ProfileTab = 'wall' | 'collection' | 'wishlist'

interface ProfileStats {
  releasesCount: number
  wishlistCount: number
  followersCount: number
  followingCount: number
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { appUser } = useUserStore()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    releasesCount: 0,
    wishlistCount: 0,
    followersCount: 0,
    followingCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>('wall')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const tabsRef = useRef<HTMLDivElement>(null)
  const isOwnProfile = currentUser?.id === profileUser?.uid

  useAnimFade([!!profileUser])

  // Charger le profil
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true)
        return
      }
      try {
        setLoading(true)
        if (appUser && appUser.username === username) {
          setProfileUser(appUser)
          return
        }
        const user = await getUserByUsername(username)
        if (!user) {
          setNotFound(true)
          return
        }
        setProfileUser(user)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username, appUser])

  // Sync avec appUser
  useEffect(() => {
    if (appUser && profileUser && appUser.uid === profileUser.uid) {
      setProfileUser(appUser)
    }
  }, [appUser, profileUser])

  // Charger les stats
  useEffect(() => {
    if (!profileUser) return
    const loadStats = async () => {
      try {
        const [vinylStats, followStats] = await Promise.all([
          getVinylStats(profileUser.uid),
          getFollowStats(profileUser.uid),
        ])
        setStats({
          releasesCount: vinylStats.collectionCount,
          wishlistCount: vinylStats.wishlistCount,
          followersCount: followStats.followersCount,
          followingCount: followStats.followingCount,
        })
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      }
    }
    loadStats()
  }, [profileUser])

  const handleFollowChange = async () => {
    if (!profileUser) return
    try {
      const followStats = await getFollowStats(profileUser.uid)
      setStats((prev) => ({
        ...prev,
        followersCount: followStats.followersCount,
        followingCount: followStats.followingCount,
      }))
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des stats:', error)
    }
  }

  // Tab indicator
  const positionIndicator = useCallback((btn: HTMLButtonElement) => {
    if (!tabsRef.current) return
    const parentRect = tabsRef.current.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setIndicatorStyle({ left: btnRect.left - parentRect.left, width: btnRect.width })
  }, [])

  useEffect(() => {
    if (!tabsRef.current) return
    const activeBtn = tabsRef.current.querySelector<HTMLButtonElement>('.profile__tab.is-active')
    if (activeBtn) positionIndicator(activeBtn)
  }, [activeTab, profileUser, positionIndicator])

  useEffect(() => {
    const handleResize = () => {
      const activeBtn = tabsRef.current?.querySelector<HTMLButtonElement>('.profile__tab.is-active')
      if (activeBtn) positionIndicator(activeBtn)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [positionIndicator])

  const switchTab = (tab: ProfileTab, btn: HTMLButtonElement) => {
    setActiveTab(tab)
    positionIndicator(btn)
    setTimeout(() => {
      document
        .querySelectorAll('.profile__panel.is-active .anim-fade:not(.is-visible)')
        .forEach((el, i) => {
          ;(el as HTMLElement).style.transitionDelay = `${i * 0.06}s`
          requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')))
        })
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs: ProfileTab[] = ['wall', 'collection', 'wishlist']
    const currentIndex = tabs.indexOf(activeTab)
    let nextIndex = -1
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex >= 0) {
      e.preventDefault()
      const btns = tabsRef.current?.querySelectorAll<HTMLButtonElement>('.profile__tab')
      if (btns?.[nextIndex]) {
        btns[nextIndex].focus()
        switchTab(tabs[nextIndex], btns[nextIndex])
      }
    }
  }

  if (notFound) return <Navigate to="/404" replace />

  if (loading || authLoading || !profileUser) {
    return (
      <main className="profile">
        <div className="profile__cover">
          <div className="profile__cover-bg" />
        </div>
        <div className="profile__header">
          <div className="profile__header-inner">
            <div className="profile__avatar-wrap">
              <div className="profile__avatar" style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="profile__info">
              <div
                style={{
                  height: '1.8rem',
                  width: '180px',
                  background: 'var(--surface-2)',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="profile">
      <ProfileHeader
        user={profileUser}
        stats={stats}
        isOwnProfile={isOwnProfile}
        onFollowChange={handleFollowChange}
      />

      {/* TABS */}
      <div className="profile__tabs-wrap">
        <div
          className="profile__tabs"
          ref={tabsRef}
          role="tablist"
          aria-label="Profile sections"
          onKeyDown={handleKeyDown}
        >
          <button
            className={`profile__tab ${activeTab === 'wall' ? 'is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'wall'}
            aria-controls="panel-wall"
            id="tab-wall"
            onClick={(e) => switchTab('wall', e.currentTarget)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="16" height="14" rx="2" />
              <line x1="2" y1="8" x2="18" y2="8" />
              <line x1="7" y1="8" x2="7" y2="17" />
            </svg>
            Wall
          </button>
          <button
            className={`profile__tab ${activeTab === 'collection' ? 'is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'collection'}
            aria-controls="panel-collection"
            id="tab-collection"
            onClick={(e) => switchTab('collection', e.currentTarget)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="8" />
              <circle cx="10" cy="10" r="3" />
              <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
            </svg>
            Collection
            <span className="profile__tab-count">{stats.releasesCount}</span>
          </button>
          <button
            className={`profile__tab ${activeTab === 'wishlist' ? 'is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'wishlist'}
            aria-controls="panel-wishlist"
            id="tab-wishlist"
            onClick={(e) => switchTab('wishlist', e.currentTarget)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M10 4l2 4 4.5.7-3.2 3.1.8 4.5L10 14l-4.1 2.3.8-4.5L3.5 8.7 8 8z" />
            </svg>
            Wishlist
            <span className="profile__tab-count">{stats.wishlistCount}</span>
          </button>
          <div
            className="profile__tab-indicator"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>
      </div>

      {/* PANELS */}
      <div className="profile__content">
        <div
          className={`profile__panel ${activeTab === 'wall' ? 'is-active' : ''}`}
          role="tabpanel"
          id="panel-wall"
          aria-labelledby="tab-wall"
          hidden={activeTab !== 'wall'}
        >
          <div className="profile__panel-inner">
            <Feed userId={profileUser.uid} profileFeed={true} />
          </div>
        </div>

        <div
          className={`profile__panel ${activeTab === 'collection' ? 'is-active' : ''}`}
          role="tabpanel"
          id="panel-collection"
          aria-labelledby="tab-collection"
          hidden={activeTab !== 'collection'}
        >
          <div className="profile__panel-inner">
            <ProfileVinyls
              userId={profileUser.uid}
              type="collection"
              isOwnProfile={isOwnProfile}
              username={profileUser.username}
            />
          </div>
        </div>

        <div
          className={`profile__panel ${activeTab === 'wishlist' ? 'is-active' : ''}`}
          role="tabpanel"
          id="panel-wishlist"
          aria-labelledby="tab-wishlist"
          hidden={activeTab !== 'wishlist'}
        >
          <div className="profile__panel-inner">
            <ProfileVinyls
              userId={profileUser.uid}
              type="wishlist"
              isOwnProfile={isOwnProfile}
              username={profileUser.username}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
