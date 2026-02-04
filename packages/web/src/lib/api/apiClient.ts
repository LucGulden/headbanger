import { supabase } from '../../supabaseClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Client API centralisé pour tous les appels au backend NestJS
 * Gère automatiquement l'ajout du token JWT dans les headers
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Récupère le token JWT Supabase de la session actuelle
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  /**
   * Effectue une requête HTTP avec authentification automatique
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = await this.getAuthToken()

    const headers: HeadersInit = {
      ...options.headers,
    }

    // Ajouter le token si disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // ✅ Ajouter Content-Type seulement si on a un body
    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    // Si la réponse est vide (204 No Content), retourner null
    if (response.status === 204) {
      return null as T
    }

    return response.json()
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined, // ✅ Ne pas envoyer de body si undefined
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined, // ✅ Ne pas envoyer de body si undefined
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Instance unique du client API
export const apiClient = new ApiClient(API_URL)