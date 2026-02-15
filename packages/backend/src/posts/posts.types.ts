import { PostType } from '@headbanger/shared'

type ArtistJoin = { id: string; name: string; image_url: string | null }[]

export type PostQueryResult = {
  id: string
  user_id: string
  vinyl_id: string
  type: PostType
  created_at: string
  user: {
    uid: string
    username: string
    photo_url: string | null
  }[]
  vinyl: {
    id: string
    title: string
    cover_url: string
    year: number
    country: string
    catalog_number: string
    album_id: string
    vinyl_artists: {
      position: number
      artist: ArtistJoin
    }[]
    album:
      | {
          id: string
          title: string
          cover_url: string | null
          album_artists: {
            position: number
            artist: ArtistJoin
          }[]
        }[]
      | null
  }[]
}
