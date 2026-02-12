import { create } from 'zustand'
import {
  signup,
  login,
  logout,
  getCurrentUser,
  type SignupData,
  type LoginData,
} from '../lib/api/auth'
import { socketClient } from '../lib/socket'
import { useUserStore } from './userStore'
import { useNotificationsStore } from './notificationsStore'

interface User {
  id: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  error: Error | null
  isInitializing: boolean // ← AJOUTER

  // Actions
  initialize: () => Promise<void>
  signUp: (data: SignupData) => Promise<User>
  signInWithPassword: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  setError: (error: Error | null) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  isInitializing: false, // ← AJOUTER

  // Initialiser : vérifier si l'utilisateur est connecté
  initialize: async () => {
    // ✅ Éviter les doubles initialisations
    const state = get()
    if (state.isInitializing || !state.loading) {
      console.log('⚠️ Initialize already called or completed')
      return
    }

    set({ isInitializing: true })
    console.log('🔄 AuthStore.initialize() called')

    try {
      const currentUser = await getCurrentUser()
      console.log('✅ User authenticated:', currentUser.id)

      set({ user: currentUser, loading: false, isInitializing: false })

      // Connecter le Socket.IO
      socketClient.connect(currentUser.id)

      // Initialiser userStore et notificationsStore
      await useUserStore.getState().initialize()
      await useNotificationsStore.getState().initialize()
    } catch (err) {
      // Pas de session valide
      console.log('ℹ️ No valid session')
      set({ user: null, loading: false, isInitializing: false })
    }
  },

  // Inscription
  signUp: async (data: SignupData) => {
    try {
      set({ error: null })
      console.log('🔄 Signing up...')

      const newUser = await signup(data)
      console.log('✅ Signup successful:', newUser.id)

      set({ user: newUser, loading: false })

      // Connecter le Socket.IO
      socketClient.connect(newUser.id)

      // Initialiser userStore et notificationsStore
      await useUserStore.getState().initialize()
      await useNotificationsStore.getState().initialize()

      return newUser
    } catch (err) {
      console.error('❌ Signup failed:', err)
      set({ error: err as Error })
      throw err
    }
  },

  // Connexion
  signInWithPassword: async (email: string, password: string) => {
    try {
      set({ error: null })
      console.log('🔄 Logging in...')

      const loggedUser = await login({ email, password })
      console.log('✅ Login successful:', loggedUser.id)

      set({ user: loggedUser, loading: false })

      // Connecter le Socket.IO
      socketClient.connect(loggedUser.id)

      // Initialiser userStore et notificationsStore
      await useUserStore.getState().initialize()
      await useNotificationsStore.getState().initialize()

      return loggedUser
    } catch (err) {
      console.error('❌ Login failed:', err)
      set({ error: err as Error })
      throw err
    }
  },

  // Déconnexion
  signOut: async () => {
    try {
      set({ error: null })
      console.log('🔄 Logging out...')

      await logout()
      set({ user: null, loading: false })

      // Déconnecter le Socket.IO
      socketClient.disconnect()

      // Cleanup userStore et notificationsStore
      useUserStore.getState().cleanup()
      useNotificationsStore.getState().cleanup()

      console.log('✅ Logout successful')
    } catch (err) {
      console.error('❌ Logout failed:', err)
      set({ error: err as Error })
      throw err
    }
  },

  // Setter pour l'erreur
  setError: (error: Error | null) => {
    set({ error })
  },
}))
