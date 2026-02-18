export type ArtistAlbumsQueryResult = {
  album: {
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
