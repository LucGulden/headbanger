type ArtistJoin = { id: string; name: string; image_url: string | null }[]

export type AlbumQueryResult = {
  id: string
  title: string
  cover_url: string | null
  year: number
  album_artists: {
    position: number
    artist: ArtistJoin
  }[]
}

export type VinylQueryResult = {
  id: string
  title: string
  cover_url: string
  year: number
  country: string
  catalog_number: string
  vinyl_artists: {
    position: number
    artist: ArtistJoin
  }[]
}
