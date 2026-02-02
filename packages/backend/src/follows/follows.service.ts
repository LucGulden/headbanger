import { Injectable, BadRequestException } from '@nestjs/common';
import { User, FollowStats } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Récupère les statistiques de follow d'un utilisateur
   */
  async getFollowStats(userId: string): Promise<FollowStats> {
    const supabase = this.supabaseService.getClient();

    // Compter les followers (personnes qui suivent cet utilisateur)
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followersError) {
      throw new Error(`Error counting followers: ${followersError.message}`);
    }

    // Compter les following (personnes que cet utilisateur suit)
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
  async followUser(followerId: string, followingId: string): Promise<void> {
    // Vérifier qu'on ne suit pas soi-même
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Vérifier que l'utilisateur à suivre existe
    await this.usersService.getUserByUid(followingId);

    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) {
      // Si c'est une erreur de duplication (déjà en train de suivre)
      if (error.code === '23505') {
        throw new BadRequestException('You are already following this user');
      }
      throw new Error(`Error following user: ${error.message}`);
    }
  }

  /**
   * Ne plus suivre un utilisateur
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

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
      // PGRST116 = not found, c'est OK
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

    // Récupérer les IDs des followers
    const followerIds = data.map((f) => f.follower_id);

    if (followerIds.length === 0) {
      return [];
    }

    // Récupérer les infos complètes des users
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

    // Récupérer les IDs des following
    const followingIds = data.map((f) => f.following_id);

    if (followingIds.length === 0) {
      return [];
    }

    // Récupérer les infos complètes des users
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
   * Transformation DB → User (camelCase)
   */
  private transformUserData(data: any): User {
    return {
      uid: data.uid,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      photoUrl: data.photo_url,
      bio: data.bio,
    };
  }
}