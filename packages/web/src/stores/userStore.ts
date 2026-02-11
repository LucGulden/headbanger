import { create } from 'zustand'
import type { User } from '@fillcrate/shared'
import { getCurrentUser } from '../lib/api/users'

interface UserStore {
  appUser: User | null
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  setAppUser: (user: User | null) => void
  updateAppUser: (updates: Partial<User>) => void
  cleanup: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  appUser: null,
  isInitialized: false,

  initialize: async () => {
    // Éviter les doubles initialisations
    if (get().isInitialized) {
      console.log('⚠️ UserStore déjà initialisé')
      return
    }

    try {
      // ✅ getCurrentUser utilise le userId du JWT cookie
      const user = await getCurrentUser()
      set({ 
        appUser: user,
        isInitialized: true,
      })
      console.log('✅ UserStore initialisé:', user.username)
    } catch (error) {
      console.error('❌ Erreur initialisation userStore:', error)
      set({ isInitialized: false })
    }
  },

  setAppUser: (user) => {
    set({ appUser: user })
  },

  updateAppUser: (updates) => {
    set((state) => ({
      appUser: state.appUser ? { ...state.appUser, ...updates } : null,
    }))
  },

  cleanup: () => {
    set({ 
      appUser: null,
      isInitialized: false,
    })
    console.log('🧹 UserStore nettoyé')
  },
}))