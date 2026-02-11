// ========================================
// TYPES DE BASE (snake_case DB)
// ========================================

export interface DbUser {
  uid: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbArtist {
  id: string;
  name: string;
  image_url: string | null;
  spotify_id?: string | null;
}

export interface DbAlbum {
  id: string;
  title: string;
  cover_url: string | null;
  year: number;
}

export interface DbVinyl {
  id: string;
  title: string;
  cover_url: string | null;
  year: number;
  label: string | null;
  catalog_number: string | null;
  country: string | null;
  format: string;
  album_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbPost {
  id: string;
  user_id: string;
  vinyl_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: 'post_like' | 'post_comment' | 'new_follower';
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
}

// ========================================
// TYPES DE RELATIONS (jointures)
// ========================================

export interface DbVinylArtist {
  position: number;
  artist: DbArtist;
}

export interface DbAlbumArtist {
  position: number;
  artist?: DbArtist; // Peut être undefined si jointure échoue
  artists?: DbArtist; // Variante selon la syntaxe Supabase
}

// ========================================
// TYPES COMPOSÉS (avec relations)
// ========================================

export interface DbVinylWithRelations extends DbVinyl {
  vinyl_artists: DbVinylArtist[];
  albums: DbAlbum & {
    album_artists: DbAlbumArtist[];
  };
}

export interface DbAlbumWithRelations extends DbAlbum {
  album_artists: DbAlbumArtist[];
}

export interface DbVinylLight {
  id: string;
  title: string;
  cover_url: string | null;
  year: number;
  country: string | null;
  catalog_number: string | null;
  vinyl_artists: DbVinylArtist[];
}

export interface DbAlbumArtistWithAlbum {
  position: number;
  album: DbAlbum & {
    album_artists: DbAlbumArtist[];
  };
}

// ========================================
// NOTIFICATIONS (types complexes)
// ========================================

export interface DbNotificationWithRelations extends DbNotification {
  actor: DbUser;
  post?: DbPost & {
    vinyl: DbVinyl & {
      vinyl_artists: DbVinylArtist[];
      album: DbAlbum & {
        album_artists: DbAlbumArtist[];
      };
    };
  };
  comment?: DbComment;
}

// ========================================
// TYPES AUTH (session Redis)
// ========================================

export interface Session {
  id: string;
  userId: string;
  supabaseAccessToken: string;
  supabaseRefreshToken: string;
  csrfToken: string;
  createdAt: Date;
  lastActivity: Date;
  ip?: string;
  userAgent?: string;
}

export interface AuthenticatedUser {
  id: string;
}

// ========================================
// TYPES POSTS (avec relations complètes)
// ========================================

export interface DbPostVinyl extends DbVinyl {
  vinyl_artists: DbVinylArtist[];
  album: DbAlbum & {
    album_artists: DbAlbumArtist[];
  };
}

export interface DbPostWithRelations extends DbPost {
  user: DbUser;
  vinyl: DbPostVinyl;
}

// ========================================
// TYPES USER VINYLS (avec relations)
// ========================================

export interface DbUserVinylData {
  id: string;
  added_at: string;
  release_id: string;
  vinyls: DbVinyl & {
    vinyl_artists: DbVinylArtist[];
  };
}

// ========================================
// TYPES GÉNÉRIQUES DB
// ========================================

export interface DbLike {
  post_id: string;
}

export interface DbCommentCount {
  post_id: string;
}

// ========================================
// TYPES SUPABASE AUTH
// ========================================

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}

// ========================================
// TYPES COMMENTS
// ========================================

export interface DbCommentWithUser extends DbComment {
  user: DbUser;
}

// ========================================
// TYPES FOLLOWS
// ========================================

export interface DbFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
