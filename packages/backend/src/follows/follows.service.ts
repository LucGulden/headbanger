import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { User, FollowStats } from '@headbanger/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DbUser } from 'src/common/database/database.types';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Récupère les statistiques de follow d'un utilisateur
   */
  async getFollowStats(userId: string): Promise<FollowStats> {
    const supabase = this.supabaseService.getClient();

    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followersError) {
      throw new Error(`Error counting followers: ${followersError.message}`);
    }

    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followingError) {
      throw new Error(`Error counting following: ${followingError.message}`);
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
    };
  }

  /**
   * Suivre un utilisateur
   */
  async followUser(token: string, followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    await this.usersService.getUserByUid(followingId);

    const supabase = this.supabaseService.getClientWithAuth(token);

    // 1. Créer le follow
    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('You are already following this user');
      }
      throw new Error(`Error following user: ${error.message}`);
    }

    // 2. Créer la notification (async, non-bloquant)
    await this.createFollowNotification(token, followerId, followingId);
  }

  /**
   * Ne plus suivre un utilisateur
   */
  async unfollowUser(token: string, followerId: string, followingId: string): Promise<void> {
    // 1. Supprimer la notification AVANT de supprimer le follow
    await this.notificationsService.deleteByFollow(token, followerId, followingId);

    // 2. Supprimer le follow
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new Error(`Error unfollowing user: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur suit un autre
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error checking follow: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Récupère la liste des followers d'un utilisateur
   */
  async getFollowers(userId: string): Promise<User[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching followers: ${error.message}`);
    }

    const followerIds = data.map((f) => f.follower_id);

    if (followerIds.length === 0) {
      return [];
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('uid', followerIds);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    return (users || []).map((user) => this.transformUserData(user));
  }

  /**
   * Récupère la liste des following d'un utilisateur
   */
  async getFollowing(userId: string): Promise<User[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching following: ${error.message}`);
    }

    const followingIds = data.map((f) => f.following_id);

    if (followingIds.length === 0) {
      return [];
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('uid', followingIds);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    return (users || []).map((user) => this.transformUserData(user));
  }

  /**
   * Crée une notification de follow (privée, async)
   */
  private async createFollowNotification(
    token: string,
    followerId: string,
    followedId: string,
  ): Promise<void> {
    try {
      await this.notificationsService.createNotification(
        token,
        followedId, // destinataire
        'new_follower',
        followerId, // acteur
      );
    } catch (error) {
      this.logger.error('Failed to create follow notification', error);
      // Ne pas faire échouer le follow si la notification échoue
    }
  }

  /**
   * Transformation DB → User (camelCase)
   */
  private transformUserData(data: DbUser): User {
    // 👈 any → DbUser
    return {
      uid: data.uid,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      photoUrl: data.photo_url,
      bio: data.bio || null, // 👈 Ajouter || null pour cohérence
    };
  }
}
