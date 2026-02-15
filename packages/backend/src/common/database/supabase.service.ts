import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  /**
   * Retourne un client Supabase avec le JWT de l'utilisateur
   * pour respecter les RLS policies
   */
  getClientWithAuth(userJwt: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${userJwt}`,
        },
      },
    })
  }

  /**
   * Client Supabase anonyme (pour les requêtes publiques)
   */
  getClient(): SupabaseClient {
    return this.supabase
  }
}
