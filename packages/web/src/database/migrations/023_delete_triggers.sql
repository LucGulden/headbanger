-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_post_like ON post_likes;
DROP TRIGGER IF EXISTS trigger_delete_like_notification ON post_likes;
DROP TRIGGER IF EXISTS trigger_post_comment ON comments;
DROP TRIGGER IF EXISTS trigger_delete_comment_notification ON comments;
DROP TRIGGER IF EXISTS trigger_delete_follower_notification ON follows;
DROP TRIGGER IF EXISTS on_vinyl_added_create_post ON user_vinyls;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS notify_post_like();
DROP FUNCTION IF EXISTS delete_like_notification();
DROP FUNCTION IF EXISTS notify_post_comment();
DROP FUNCTION IF EXISTS delete_comment_notification();
DROP FUNCTION IF EXISTS delete_follower_notification();
DROP FUNCTION IF EXISTS create_post_on_vinyl_add();

-- Garder uniquement le trigger updated_at
-- (ne pas supprimer update_users_updated_at)