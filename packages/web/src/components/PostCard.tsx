import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { likePost, unlikePost, hasLikedPost, subscribeToPostLikes } from '../lib/api/postLikes'
import { addComment, subscribeToPostComments, subscribeToPostCommentsCount } from '../lib/api/comments'
import type { Comment } from '@fillcrate/shared'
import { getRelativeTimeString } from '../utils/date-utils'
import CommentItem from './CommentItem'
import Button from './Button'
import { useUserStore } from '../stores/userStore'
import type { PostWithDetails } from '@fillcrate/shared'

// Type pour les commentaires optimistes (en cours de publication)
type OptimisticComment = Comment & { 
  isPending: boolean
  tempId: string
}

// Générateur d'ID temporaire unique
const generateTempId = () => `temp_${Date.now()}_${Math.random()}`

interface PostCardProps {
  post: PostWithDetails
  currentUserId?: string
  priority?: boolean
}

export default function PostCard({ 
  post, 
  currentUserId, 
  priority = false,
}: PostCardProps) {
  const { appUser } = useUserStore()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<OptimisticComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  useEffect(() => {
    if (!currentUserId) return

    const checkLike = async () => {
      const liked = await hasLikedPost(post.id)
      setIsLiked(liked)
    }

    checkLike()
  }, [currentUserId, post.id])

  // S'abonner au compteur de commentaires en temps réel (toujours actif)
  useEffect(() => {
    const unsubscribe = subscribeToPostCommentsCount(
      post.id,
      (count: number) => {
        setCommentsCount(count)
      },
      (error: Error) => {
        console.error('Erreur lors de la récupération du compteur de commentaires:', error)
      },
    )

    return () => unsubscribe()
  }, [post.id])

  // S'abonner à la liste des commentaires (seulement si section ouverte)
  useEffect(() => {
    if (!showComments) return

    const unsubscribe = subscribeToPostComments(
      post.id,
      (newComments: Comment[]) => {
        // Fusionner les commentaires DB avec les optimistes
        setComments(prevComments => {
          // Garder seulement les commentaires optimistes qui n'ont pas encore été créés
          const pendingComments = prevComments.filter(c => c.isPending)
          
          // Convertir les nouveaux commentaires en OptimisticComment
          const dbComments: OptimisticComment[] = newComments.map(c => ({
            ...c,
            isPending: false,
            tempId: '',
          }))
          
          // Fusionner : d'abord les DB (les plus anciens en premier), puis les pending
          return [...dbComments, ...pendingComments]
        })
      },
      (error: Error) => {
        console.error('Erreur lors de la récupération des commentaires:', error)
      },
    )

    return () => unsubscribe()
  }, [post.id, showComments])

  // S'abonner aux likes en temps réel (conditionnel)
  useEffect(() => {
    const unsubscribe = subscribeToPostLikes(
      post.id,
      (count: number) => {
        setLikesCount(count)
      },
      (error: Error) => {
        console.error('Erreur lors de la récupération des likes:', error)
      },
    )

    return () => unsubscribe()
  }, [post.id])

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    // Optimistic UI update
    const wasLiked = isLiked
    const previousCount = likesCount

    setIsLiked(!wasLiked)
    setLikesCount(wasLiked ? previousCount - 1 : previousCount + 1)
    setIsLiking(true)

    try {
      if (wasLiked) {
        await unlikePost(post.id)
      } else {
        await likePost(post.id)
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked)
      setLikesCount(previousCount)
      console.error('Erreur lors du like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUserId || !commentText.trim() || isCommenting || !appUser) return

    const tempId = generateTempId()
    const commentContent = commentText.trim()
    
    // Créer le commentaire optimiste
    const optimisticComment: OptimisticComment = {
      id: tempId,
      postId: post.id,
      content: commentContent,
      createdAt: new Date().toISOString(),
      user: {
        uid: currentUserId,
        username: appUser.username,
        photoUrl: appUser.photoUrl,
      },
      isPending: true,
      tempId,
    }

    // Ajout optimiste à la liste
    setComments(prev => [...prev, optimisticComment])
    setCommentText('')
    setIsCommenting(true)

    try {
      await addComment(post.id, commentContent)
      
      // Le vrai commentaire arrivera via la subscription dans < 500ms
      setComments(prev => prev.filter(c => c.tempId !== tempId))
    } catch (error) {
      // Revert on error : retirer le commentaire optimiste
      setComments(prev => prev.filter(c => c.tempId !== tempId))
      console.error('Erreur lors de l\'ajout du commentaire:', error)
      alert('Impossible d\'ajouter le commentaire')
    } finally {
      setIsCommenting(false)
    }
  }

  const postTypeText =
    post.type === 'collection_add' ? 'a ajouté' : 'souhaite ajouter'
  const collectionText =
    post.type === 'collection_add' ? 'sa collection' : 'sa wishlist'

  return (
    <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6 transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Link to={`/profile/${post.user.username}`} className="flex-shrink-0">
          <Avatar src={post.user.photoUrl} username={post.user.username} size="md" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${post.user.username}`}
              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              {post.user.username}
            </Link>
            <span className="text-sm text-[var(--foreground-muted)]">
              {getRelativeTimeString(post.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-[var(--foreground-muted)]">
            {postTypeText}{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {post.vinyl.title}
            </span>{' '}
            de{' '}
            {post.vinyl.artists.map((artist, index) => (
              <span key={artist.id}>
                <span className="font-semibold text-[var(--foreground)]">
                  {artist.name}
                </span>
                {index < post.vinyl.artists.length - 1 && ', '}
              </span>
            ))}
            {' '}à {collectionText}
          </p>
        </div>
      </div>

      {/* Album Cover - LIEN VERS LA PAGE VINYLE */}
      <Link 
        to={`/vinyl/${post.vinyl.id}`}
        className="block mb-4 relative w-full max-w-md mx-auto aspect-square group"
      >
        <img
          src={post.vinyl.coverUrl}
          alt={`${post.vinyl.title} - ${post.vinyl.artists.map(a => a.name).join(', ')}`}
          className="rounded-xl shadow-md object-cover w-full h-full transition-transform group-hover:scale-[1.02]"
          loading={priority ? 'eager' : 'lazy'}
        />
        {/* Overlay au hover pour indiquer que c'est cliquable */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
          <svg 
            className="w-12 h-12 text-white drop-shadow-lg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
            />
          </svg>
        </div>
      </Link>

      {/* Actions (Like, Comment) */}
      <div className="flex items-center gap-6 mb-4 pt-2 border-t border-[var(--background-lighter)]">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={!currentUserId || isLiking}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLiking ? (
            <svg className="h-6 w-6 animate-spin text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'fill-none'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
          <span className={isLiked ? 'text-red-500 font-semibold' : ''}>
            {likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{commentsCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[var(--background-lighter)] pt-4">
          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-1 mb-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.isPending ? comment.tempId : comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  isPending={comment.isPending}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          {currentUserId && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 rounded-lg border border-[var(--background-lighter)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
                disabled={isCommenting}
              />
              <Button type="submit" disabled={!commentText.trim() || isCommenting} variant="primary">
                {isCommenting ? 'Envoi...' : 'Envoyer'}
              </Button>
            </form>
          )}

          {!currentUserId && (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-2">
              <Link 
                to="/login" 
                className="text-[var(--primary)] hover:underline"
              >
                Connectez-vous
              </Link>
              {' '}pour commenter
            </p>
          )}
        </div>
      )}
    </div>
  )
}