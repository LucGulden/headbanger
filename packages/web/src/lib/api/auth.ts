import { apiClient } from '../apiClient'

export interface SignupData {
  email: string
  username: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthUser {
  id: string
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signup(data: SignupData): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/auth/signup', data)
}

/**
 * Connexion
 */
export async function login(data: LoginData): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/auth/login', data)
}

/**
 * Récupère l'utilisateur connecté
 */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/auth/me')
}

/**
 * Rafraîchit le token JWT
 */
export async function refreshToken(): Promise<void> {
  await apiClient.post<void>('/auth/refresh')
}

/**
 * Déconnexion
 */
export async function logout(): Promise<void> {
  await apiClient.post<void>('/auth/logout')
}