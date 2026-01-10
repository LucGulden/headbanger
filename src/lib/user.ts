import { supabase } from '../supabaseClient'

export function validateUsername(username: string): boolean {
  // Règles : 3-20 caractères, lettres, chiffres, - et _
  const regex = /^[a-zA-Z0-9_-]{3,20}$/
  return regex.test(username)
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)

    if (error) {
      console.error('Erreur lors de la vérification du username:', error)
      return false
    }

    // Si data est null ou vide, le username est disponible
    // Si data contient un résultat, le username est déjà pris
    return !data || data.length === 0
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return false
  }
}