import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import FeedComponent from '../components/Feed'
import { useUserStore } from '../stores/userStore'
import { getHueFromString } from '../utils/hue'
import '../styles/feed.css'
import { useState } from 'react'
import { useAnimFade } from '../hooks/useAnimFade'

// TODO_ — données en dur en attendant les APIs
const TODO_TRENDING = [
  { title: 'OK Computer', artist: 'Radiohead', hue: 220, adds: 847 },
  { title: 'Kind of Blue', artist: 'Miles Davis', hue: 45, adds: 612 },
  { title: 'Abbey Road', artist: 'The Beatles', hue: 25, adds: 589 },
  { title: 'Currents', artist: 'Tame Impala', hue: 280, adds: 534 },
  { title: 'Blonde', artist: 'Frank Ocean', hue: 60, adds: 498 },
]

const TODO_SUGGESTED = [
  { name: 'Jake Thompson', username: 'jake-t', hue: 340, records: 189 },
  { name: 'Marie Laurent', username: 'marie-l', hue: 25, records: 234 },
  { name: 'Ryu Tanaka', username: 'ryu-vinyl', hue: 210, records: 445 },
  { name: 'Clara Dupont', username: 'clara-d', hue: 350, records: 312 },
]

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toString()
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function FeedPage() {
  useAnimFade()
  const { user } = useAuth()
  const { appUser } = useUserStore()

  if (!user) return null

  const username = appUser?.username || ''
  const avatarHue = getHueFromString(username)
  const initials = getInitials(username)

  return (
    <main className="feed-page">
      <div className="feed-page__layout">
        {/* SIDEBAR */}
        <aside className="feed-sidebar">
          {/* User Card */}
          <Link to={`/profile/${username}`} className="feed-sidebar__user anim-fade" data-delay="0">
            <div
              className="feed-sidebar__avatar"
              style={{ '--avatar-hue': avatarHue } as React.CSSProperties}
            >
              {initials}
            </div>
            <div className="feed-sidebar__user-info">
              <span className="feed-sidebar__name">{username}</span>
              <span className="feed-sidebar__handle">@{username}</span>
            </div>
          </Link>

          {/* Stats */}
          <div className="feed-sidebar__stats anim-fade" data-delay="1">
            <div className="feed-sidebar__stat">
              {/* TODO_collectionCount: ajouter au store/API appUser */}
              <span className="feed-sidebar__stat-num">—</span>
              <span className="feed-sidebar__stat-label">Collection</span>
            </div>
            <div className="feed-sidebar__stat-divider"></div>
            <div className="feed-sidebar__stat">
              {/* TODO_wishlistCount: ajouter au store/API appUser */}
              <span className="feed-sidebar__stat-num">—</span>
              <span className="feed-sidebar__stat-label">Wishlist</span>
            </div>
            <div className="feed-sidebar__stat-divider"></div>
            <div className="feed-sidebar__stat">
              {/* TODO_followingCount: ajouter au store/API appUser */}
              <span className="feed-sidebar__stat-num">—</span>
              <span className="feed-sidebar__stat-label">Following</span>
            </div>
          </div>

          {/* Trending */}
          <div className="feed-sidebar__section anim-fade" data-delay="2">
            <h3 className="feed-sidebar__section-title">
              <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <path d="M9 2l2.5 5 5.5.8-4 3.9.9 5.3L9 14.5 4.1 17l.9-5.3-4-3.9L6.5 7z" />
              </svg>
              Trending today
            </h3>
            <div className="feed-sidebar__trending">
              {TODO_TRENDING.map((t) => (
                <div
                  key={t.title}
                  className="feed-trending-item"
                  style={{ '--cover-hue': t.hue } as React.CSSProperties}
                >
                  <div className="feed-trending-item__cover">
                    <div className="feed-trending-item__grooves"></div>
                  </div>
                  <div className="feed-trending-item__info">
                    <span className="feed-trending-item__title">{t.title}</span>
                    <span className="feed-trending-item__artist">{t.artist}</span>
                  </div>
                  <span className="feed-trending-item__count">{formatNumber(t.adds)} adds</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Collectors */}
          <div className="feed-sidebar__section anim-fade" data-delay="3">
            <h3 className="feed-sidebar__section-title">
              <svg
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <circle cx="6" cy="7" r="3" />
                <circle cx="13" cy="7" r="3" />
                <path d="M0 16c0-3 2-5 6-5s6 2 6 5" />
                <path d="M10 16c0-3 1.5-5 3-5s3 2 3 5" />
              </svg>
              Collectors to follow
            </h3>
            <div className="feed-sidebar__suggested">
              {TODO_SUGGESTED.map((s) => (
                <SuggestedItem key={s.username} {...s} />
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <div className="feed-main">
          <FeedComponent />
        </div>
      </div>
    </main>
  )
}

function SuggestedItem({ name, username, hue, records }: (typeof TODO_SUGGESTED)[0]) {
  const [following, setFollowing] = useState(false)

  return (
    <div className="feed-suggested-item" style={{ '--avatar-hue': hue } as React.CSSProperties}>
      <Link to={`/profile/${username}`} className="feed-suggested-item__avatar">
        {name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)}
      </Link>
      <div className="feed-suggested-item__info">
        <span className="feed-suggested-item__name">{name}</span>
        {/* TODO_recordsCount: remplacer par données API */}
        <span className="feed-suggested-item__meta">{records} records</span>
      </div>
      <button
        className={`feed-suggested-item__btn ${following ? 'is-following' : ''}`}
        onClick={() => setFollowing((v) => !v)}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}
