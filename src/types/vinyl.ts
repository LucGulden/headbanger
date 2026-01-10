export interface Album {
  id: string;
  spotify_id: string;
  spotify_url: string | null;
  title: string;
  artist: string;
  cover_url: string | null;
  year: number | null;
  created_at: string;
}

export interface Vinyl {
  id: string;
  album_id: string | null;
  title: string;
  artist: string;
  cover_url: string | null;
  release_year: number | null;
  year: number | null;
  label: string | null;
  catalog_number: string | null;
  country: string | null;
  format: string | null;
  created_at: string;
}

export interface UserVinyl {
  id: string;
  user_id: string;
  release_id: string;
  type: 'collection' | 'wishlist';
  added_at: string;
}

// Type enrichi pour l'affichage
export interface UserVinylWithDetails extends UserVinyl {
  vinyl: Vinyl;
}