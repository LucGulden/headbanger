const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    // ✅ Ne pas ajouter Content-Type si c'est un FormData
    const isFormData = options.body instanceof FormData
    
    const headers = isFormData
      ? {} // Pas de Content-Type, le browser le gère
      : { 'Content-Type': 'application/json' } // JSON pour le reste

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers, // Permet override si nécessaire
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }))
      throw new Error(error.message || `Erreur HTTP ${response.status}`)
    }

    // Si pas de contenu (204, DELETE), retourner vide
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T
    }

    return response.json()
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'GET',
    })
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    })
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: formData,
      // ⚠️ Ne pas mettre Content-Type, détecté automatiquement dans request()
    })
  }
}

export const apiClient = new ApiClient(API_URL)