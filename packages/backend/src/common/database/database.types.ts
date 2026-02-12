// ========================================
// TYPES DE BASE — Tables Supabase
// ========================================

export interface DbUser {
  uid: string
  username: string
  first_name: string | null
  last_name: string | null
  bio: string | null
  photo_url: string | null
  created_at?: string
  updated_at?: string
}

export interface DbArtist {
  id: string
  name: string
  image_url: string | null
  spotify_id?: string | null
}

export interface DbVinyl {
  id: string
  title: string
  cover_url: string
  year: number
  label: string
  catalog_number: string
  country: string
  format: string
  album_id: string
  created_at?: string
  updated_at?: string
}

export interface DbComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}

export interface DbLike {
  post_id: string
}

// ========================================
// TYPES AUTH & SESSION
// ========================================

export interface Session {
  id: string
  userId: string
  supabaseAccessToken: string
  supabaseRefreshToken: string
  csrfToken: string
  createdAt: Date
  lastActivity: Date
  ip?: string
  userAgent?: string
}

export interface AuthenticatedUser {
  id: string
}
