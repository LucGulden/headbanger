export type CommentQueryResult = {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  user: {
    uid: string
    username: string
    photo_url: string | null
  }
}
