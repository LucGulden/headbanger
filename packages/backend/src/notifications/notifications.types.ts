type ArtistNameJoin = { name: string }[]

export type NotificationQueryResult = {
  id: string
  type: 'post_like' | 'post_comment' | 'new_follower'
  read: boolean
  created_at: string
  actor: {
    uid: string
    username: string
    first_name: string | null
    last_name: string | null
    photo_url: string | null
  }[]
  post:
    | {
        id: string
        vinyl_id: string
        vinyl:
          | {
              id: string
              title: string
              cover_url: string | null
              vinyl_artists: { position: number; artist: ArtistNameJoin }[]
              album:
                | {
                    id: string
                    title: string
                    album_artists: { position: number; artist: ArtistNameJoin }[]
                  }[]
                | null
            }[]
          | null
      }[]
    | null
  comment:
    | {
        id: string
        content: string
      }[]
    | null
}

// Requête allégée utilisée dans createNotification (sans le détail vinyl)
export type NotificationCreateQueryResult = {
  id: string
  type: 'post_like' | 'post_comment' | 'new_follower'
  read: boolean
  created_at: string
  actor: {
    uid: string
    username: string
    first_name: string | null
    last_name: string | null
    photo_url: string | null
  }[]
  post:
    | {
        id: string
        vinyl_id: string
      }[]
    | null
  comment:
    | {
        id: string
        content: string
      }[]
    | null
}
