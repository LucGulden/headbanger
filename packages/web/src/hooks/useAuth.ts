import { useEffect } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

/**
 * Hook wrapper pour useAuthStore
 * Conserve la compatibilité avec l'ancien code
 */
export function useAuth() {
  const store = useAuthStore()

  // Initialiser UNE SEULE FOIS au montage du premier composant
  useEffect(() => {
    if (store.loading && !store.isInitializing) {
      console.log('🎯 useAuth: Triggering initialize()')
      store.initialize()
    }
  }, []) // ← Dépendances VIDES pour n'appeler qu'une fois

  return {
    user: store.user,
    loading: store.loading,
    error: store.error,
    signUp: store.signUp,
    signInWithPassword: store.signInWithPassword,
    signOut: store.signOut,
  }
}