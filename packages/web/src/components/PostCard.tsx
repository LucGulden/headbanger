import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { likePost, unlikePost, hasLikedPost, getLikesCount } from '../lib/api/postLikes'
import { addComment, getCommentsCount, getComments } from '../lib/api/comments'
import type { Comment, PostWithDetails } from '@headbanger/shared'
import { getRelativeTimeString } from '../utils/date-utils'
import { getHueFromString } from '../utils/hue'
import CommentItem from './CommentItem'
import { useUserStore } from '../stores/userStore'
import VinylCover from './VinylCover'

type OptimisticComment = Comment & { isPending: boolean; tempId: string }
const generateTempId = () => `temp_${Date.now()}_${Math.random()}`

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

interface PostCardProps {
  post: PostWithDetails
  currentUserId?: string
  priority?: boolean
}

export default function PostCard({ post, currentUserId, priority = false }: PostCardProps) {
  const { appUser } = useUserStore()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<OptimisticComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  const coverHue = getHueFromString(post.vinyl.id)
  const authorHue = getHueFromString(post.user.username)
  const authorInitials = getInitials(post.user.username)

  const isCollection = post.type === 'collection_add'
  const actionLabel = isCollection ? 'added to collection' : 'wishlisted'
  const tagClass = isCollection
    ? 'feed-post__record-tag--collection'
    : 'feed-post__record-tag--wishlist'
  const tagText = isCollection ? 'Collection' : 'Wishlist'

  useEffect(() => {
    if (!currentUserId) return
    hasLikedPost(post.id).then(setIsLiked)
  }, [currentUserId, post.id])

  useEffect(() => {
    if (!showComments) return
    setLoadingComments(true)
    getComments(post.id)
      .then((data) => setComments(data.map((c) => ({ ...c, isPending: false, tempId: '' }))))
      .catch((err) => console.error(err))
      .finally(() => setLoadingComments(false))
  }, [showComments, post.id])

  const handleLike = async () => {
    if (!currentUserId || isLiking) return
    const wasLiked = isLiked
    const prevCount = likesCount
    setIsLiked(!wasLiked)
    setLikesCount(wasLiked ? prevCount - 1 : prevCount + 1)
    setIsLiking(true)
    try {
      if (wasLiked) {
        await unlikePost(post.id)
      } else {
        await likePost(post.id)
      }
      setLikesCount(await getLikesCount(post.id))
    } catch {
      setIsLiked(wasLiked)
      setLikesCount(prevCount)
    } finally {
      setIsLiking(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !commentText.trim() || isCommenting || !appUser) return
    const tempId = generateTempId()
    const content = commentText.trim()
    const optimistic: OptimisticComment = {
      id: tempId,
      postId: post.id,
      content,
      createdAt: new Date().toISOString(),
      user: { uid: currentUserId, username: appUser.username, photoUrl: appUser.photoUrl },
      isPending: true,
      tempId,
    }
    setComments((prev) => [...prev, optimistic])
    setCommentsCount((prev) => prev + 1)
    setCommentText('')
    setIsCommenting(true)
    try {
      const newComment = await addComment(post.id, content)
      setComments((prev) =>
        prev.map((c) =>
          c.tempId === tempId ? { ...newComment, isPending: false, tempId: '' } : c,
        ),
      )
      setCommentsCount(await getCommentsCount(post.id))
    } catch {
      setComments((prev) => prev.filter((c) => c.tempId !== tempId))
      setCommentsCount((prev) => Math.max(0, prev - 1))
    } finally {
      setIsCommenting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentsCount((prev) => Math.max(0, prev - 1))
    try {
      setCommentsCount(await getCommentsCount(post.id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <article className="feed-post">
      {/* Header */}
      <div className="feed-post__header">
        <Link to={`/profile/${post.user.username}`}>
          <div
            className="feed-post__avatar"
            style={{ '--avatar-hue': authorHue } as React.CSSProperties}
          >
            {authorInitials}
          </div>
        </Link>
        <div className="feed-post__user-info">
          <Link to={`/profile/${post.user.username}`}>
            <span className="feed-post__author">{post.user.username}</span>
          </Link>
          <span className="feed-post__action-label">{actionLabel}</span>
        </div>
        <time className="feed-post__time">{getRelativeTimeString(post.createdAt)}</time>
      </div>

      {/* Record Card */}
      <Link
        to={`/vinyl/${post.vinyl.id}`}
        className="feed-post__record"
        style={{ '--cover-hue': coverHue } as React.CSSProperties}
      >
        <VinylCover
          src={post.vinyl.coverUrl}
          seed={post.vinyl.id}
          alt={`${post.vinyl.title} - ${post.vinyl.artists.map((a) => a.name).join(', ')}`}
          className="feed-post__cover"
          priority={priority}
        />
        <div className="feed-post__record-info">
          <span className="feed-post__record-title">{post.vinyl.title}</span>
          <span className="feed-post__record-artist">
            {post.vinyl.artists.map((a) => a.name).join(', ')}
          </span>
          {/* TODO_vinylMeta: ajouter year/label/detail au type PostWithDetails */}
          <span className="feed-post__record-meta">TODO_year · TODO_label · TODO_detail</span>
          <div className={`feed-post__record-tag ${tagClass}`}>{tagText}</div>
        </div>
      </Link>

      {/* Post text — TODO_postContent: vérifier nom du champ dans PostWithDetails */}
      {(post as any).content && <p className="feed-post__text">{(post as any).content}</p>}

      {/* Actions */}
      <div className="feed-post__actions">
        <button
          className={`feed-post__action-btn feed-post__like-btn ${isLiked ? 'is-liked' : ''}`}
          onClick={handleLike}
          disabled={!currentUserId || isLiking}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
          <span>{likesCount}</span>
        </button>

        <button
          className={`feed-post__action-btn feed-post__comment-btn ${showComments ? 'is-open' : ''}`}
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M2 3h16a1 1 0 011 1v10a1 1 0 01-1 1H6l-3 3v-3H2a1 1 0 01-1-1V4a1 1 0 011-1z" />
          </svg>
          <span>{commentsCount}</span>
        </button>

        {/* TODO_shares: ajouter champ shares à PostWithDetails + API */}
        <button className="feed-post__action-btn">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M17 7v6a2 2 0 01-2 2H7" />
            <path d="M3 11l4 4 4-4" />
            <path d="M3 13V5a2 2 0 012-2h8" />
          </svg>
          <span>0</span>
        </button>
      </div>

      {/* Comments */}
      <div className={`feed-post__comments ${showComments ? 'is-open' : ''}`}>
        <div className="feed-post__comments-list">
          {loadingComments && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              Loading comments...
            </p>
          )}
          {!loadingComments &&
            comments.map((comment) => (
              <CommentItem
                key={comment.isPending ? comment.tempId : comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isPending={comment.isPending}
                onDelete={() => handleDeleteComment(comment.id)}
              />
            ))}
          {!loadingComments && comments.length === 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              No comments yet
            </p>
          )}
        </div>

        {currentUserId && appUser ? (
          <div className="feed-post__comment-input">
            <div
              className="feed-comment__avatar feed-comment__avatar--self"
              style={{ '--avatar-hue': getHueFromString(appUser.username) } as React.CSSProperties}
            >
              {getInitials(appUser.username)}
            </div>
            <form className="feed-post__comment-field" onSubmit={handleAddComment}>
              <textarea
                className="feed-post__comment-textarea"
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment(e as any)
                  }
                }}
                placeholder="Add a comment..."
                rows={1}
                disabled={isCommenting}
              />
              <button
                type="submit"
                className="feed-post__comment-send"
                aria-label="Send comment"
                disabled={!commentText.trim() || isCommenting}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M2 10l7-7v4.5c6 .5 9 3.5 9 9.5-2-4-5-5.5-9-5.5V16z" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.7rem 0' }}>
            <Link to="/login" style={{ color: 'var(--accent)' }}>
              Log in
            </Link>{' '}
            to comment
          </p>
        )}
      </div>
    </article>
  )
}
