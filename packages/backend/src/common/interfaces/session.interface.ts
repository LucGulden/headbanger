export interface Session {
  id: string // UUID session
  userId: string // UID Supabase
  supabaseAccessToken: string // Token Supabase (pour appels DB)
  supabaseRefreshToken: string // Refresh token Supabase
  csrfToken: string // Token CSRF
  createdAt: Date
  lastActivity: Date
  ip?: string
  userAgent?: string
}
