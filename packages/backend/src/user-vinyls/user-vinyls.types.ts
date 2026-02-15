export type UserVinylQueryResult = {
  id: string
  added_at: string
  release_id: string
  vinyls: {
    id: string
    title: string
    cover_url: string
    year: number
    country: string
    catalog_number: string
    vinyl_artists: {
      position: number
      artist: { id: string; name: string; image_url: string | null }[]
    }[]
  }[]
}
