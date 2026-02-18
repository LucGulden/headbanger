import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteComment } from '../lib/api/comments'
import { getRelativeTimeString } from '../utils/date-utils'
import { getHueFromString } from '../utils/hue'
import type { Comment } from '@headbanger/shared'

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  isPending?: boolean
  onDelete: () => void
}

export default function CommentItem({
  comment,
  currentUserId,
  isPending = false,
  onDelete,
}: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = currentUserId === comment.user.uid
  const avatarHue = getHueFromString(comment.user.username)
  const initials = comment.user.username.slice(0, 2).toUpperCase()

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce commentaire ?')) return
    setIsDeleting(true)
    try {
      await deleteComment(comment.id)
      onDelete()
    } catch {
      alert('Impossible de supprimer le commentaire')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="feed-comment"
      style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.3s' }}
    >
      <Link
        to={`/profile/${comment.user.username}`}
        className="feed-comment__avatar"
        style={{ '--avatar-hue': avatarHue } as React.CSSProperties}
      >
        {comment.user.photoUrl ? (
          <img
            src={comment.user.photoUrl}
            alt={comment.user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          initials
        )}
      </Link>

      <div className="feed-comment__body">
        <div className="feed-comment__header">
          <Link to={`/profile/${comment.user.username}`} className="feed-comment__author">
            {comment.user.username}
          </Link>
          <time className="feed-comment__time">
            {isPending ? 'Publishing…' : getRelativeTimeString(comment.createdAt)}
          </time>
        </div>
        <p className="feed-comment__text">{comment.content}</p>
      </div>

      {isOwner && !isPending && (
        <button
          className="feed-comment__delete"
          onClick={handleDelete}
          disabled={isDeleting}
          title={isDeleting ? 'Deleting…' : 'Delete comment'}
        >
          {isDeleting ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 0.8s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M4 12a8 8 0 018-8" strokeOpacity="0.75" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
