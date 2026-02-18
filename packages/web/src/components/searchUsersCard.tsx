import { Link } from 'react-router-dom'
import { getHueFromString } from '../utils/hue'
import type { User } from '@headbanger/shared'

export default function SearchUserCard({ user, index = 0 }: { user: User; index?: number }) {
  const hue = getHueFromString(user.username)
  const initials = user.username
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link
      to={`/profile/${user.username}`}
      className="user-card"
      style={{ '--avatar-hue': hue, animationDelay: `${index * 0.06}s` } as React.CSSProperties}
    >
      <div className="user-card__avatar">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.photoUrl ?? user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          initials
        )}
      </div>
      <div className="user-card__info">
        {/* TODO return un display name*/}
        {/* <span className="user-card__name">{user.displayName ?? user.username}</span> */}
        <span className="user-card__username">@{user.username}</span>
        <div className="user-card__meta">
          {/* TODO_collectionCount */}
          {(user as any).collectionCount !== undefined && (
            <span>
              <span className="user-card__meta-value">{(user as any).collectionCount}</span> records
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
