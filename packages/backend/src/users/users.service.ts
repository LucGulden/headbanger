import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '@headbanger/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { DbUser } from '../common/database/database.types';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère un utilisateur par son UID
   */
  async getUserByUid(uid: string): Promise<User> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();

    if (error || !data) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    return this.transformUserData(data as DbUser);
  }

  /**
   * Récupère un utilisateur par son username
   */
  async getUserByUsername(username: string): Promise<User> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return this.transformUserData(data as DbUser);
  }

  /**
   * Recherche d'utilisateurs par username, nom ou prénom
   */
  async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const supabase = this.supabaseService.getClient();
    const searchTerm = query.trim().toLowerCase();

    const { data, error } = await supabase
      .from('users')
      .select('uid, username, first_name, last_name, bio, photo_url')
      .or(
        `username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
      )
      .order('username', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error searching users: ${error.message}`);
    }

    return (data || []).map((user) => this.transformUserData(user as DbUser));
  }

  /**
   * Vérifie la disponibilité d'un username
   */
  async checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('uid, username')
      .eq('username', username);

    if (error) {
      throw new Error(`Error checking username: ${error.message}`);
    }

    // Si aucun résultat, le username est disponible
    if (!data || data.length === 0) {
      return true;
    }

    // Si un utilisateur existe avec ce username, vérifier si c'est l'utilisateur actuel
    if (excludeUserId) {
      return data[0].uid === excludeUserId;
    }

    return false;
  }

  /**
   * Met à jour le profil utilisateur
   */
  async updateUserProfile(token: string, userId: string, updateDto: UpdateUserDto): Promise<User> {
    // Si le username change, vérifier sa disponibilité
    if (updateDto.username) {
      const isAvailable = await this.checkUsernameAvailability(updateDto.username, userId);

      if (!isAvailable) {
        throw new BadRequestException('Username is already taken');
      }
    }

    const supabase = this.supabaseService.getClientWithAuth(token);

    // Convertir en snake_case pour la BDD
    const dbData: Partial<DbUser> = {};
    if (updateDto.username !== undefined) dbData.username = updateDto.username;
    if (updateDto.firstName !== undefined) dbData.first_name = updateDto.firstName;
    if (updateDto.lastName !== undefined) dbData.last_name = updateDto.lastName;
    if (updateDto.bio !== undefined) dbData.bio = updateDto.bio;
    if (updateDto.photoUrl !== undefined) dbData.photo_url = updateDto.photoUrl;

    const { data, error } = await supabase
      .from('users')
      .update(dbData)
      .eq('uid', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }

    return this.transformUserData(data as DbUser);
  }

  /**
   * Transformation DB → User (camelCase)
   */
  private transformUserData(data: DbUser): User {
    return {
      uid: data.uid,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      photoUrl: data.photo_url,
      bio: data.bio || null,
    };
  }
}
