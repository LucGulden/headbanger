import type { DbVinyl } from '../common/database/database.types'

export type VinylByIdQueryResult = DbVinyl & {
  vinyl_artists: {
    position: number
    artist: { id: string; name: string; image_url: string | null }
  }[]
  albums: {
    id: string
    title: string
    cover_url: string | null
    year: number
    album_artists: {
      position: number
      artist: { id: string; name: string; image_url: string | null }
    }[]
  }
}
