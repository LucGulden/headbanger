-- ========================================
-- MIGRATION: Nettoyage et correction des RLS
-- ========================================

-- ========================================
-- 1. SUPPRESSION DES DOUBLONS
-- ========================================

-- users: Supprimer le doublon SELECT
DROP POLICY IF EXISTS "users_username_check" ON users;

-- vinyls: Supprimer le doublon UPDATE (garder vinyls_update_authenticated)
DROP POLICY IF EXISTS "vinyls_authenticated_update" ON vinyls;

-- user_vinyls: Supprimer le SELECT propriétaire (redondant avec public)
DROP POLICY IF EXISTS "user_releases_owner_read" ON user_vinyls;

-- ========================================
-- 2. FOLLOWS: Supprimer UPDATE + colonne status
-- ========================================

-- Supprimer la policy UPDATE (plus nécessaire)
DROP POLICY IF EXISTS "follows_update_own" ON follows;

-- Supprimer la colonne status avec CASCADE
ALTER TABLE follows DROP COLUMN IF EXISTS status CASCADE;

-- ========================================
-- 3. SUPPRIMER LA VIEW posts_with_stats (AVANT de drop content)
-- ========================================

DROP VIEW IF EXISTS posts_with_stats CASCADE;

-- ========================================
-- 4. POSTS: Gestion par trigger + suppression colonne content
-- ========================================

-- Supprimer la policy INSERT propriétaire (sera géré par trigger)
DROP POLICY IF EXISTS "posts_owner_insert" ON posts;

-- Créer une policy INSERT pour authenticated (pour le trigger)
CREATE POLICY "posts_trigger_insert" ON posts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Supprimer la colonne content
ALTER TABLE posts DROP COLUMN IF EXISTS content CASCADE;

-- ========================================
-- 5. BLOQUER LES UPDATES
-- ========================================

-- post_likes: Bloquer UPDATE
CREATE POLICY "post_likes_update_disabled" ON post_likes
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- comments: Remplacer UPDATE propriétaire par bloqué
DROP POLICY IF EXISTS "comments_owner_update" ON comments;
CREATE POLICY "comments_update_disabled" ON comments
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- albums: Remplacer UPDATE authenticated par bloqué
DROP POLICY IF EXISTS "albums_update_authenticated" ON albums;
CREATE POLICY "albums_update_disabled" ON albums
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ========================================
-- 6. BLOQUER LES DELETES
-- ========================================

-- albums: Bloquer DELETE
CREATE POLICY "albums_delete_disabled" ON albums
  FOR DELETE
  USING (false);

-- vinyls: Bloquer DELETE
CREATE POLICY "vinyls_delete_disabled" ON vinyls
  FOR DELETE
  USING (false);

-- ========================================
-- 7. NOTIFICATIONS: Supprimer DELETE
-- ========================================

DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;

-- ========================================
-- 8. TRIGGER: Création automatique des posts
-- ========================================

-- Fonction de création automatique des posts (collection ET wishlist)
CREATE OR REPLACE FUNCTION create_post_on_vinyl_add()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer un post pour collection_add ou wishlist_add
  IF NEW.type = 'collection' THEN
    INSERT INTO posts (user_id, vinyl_id, type)
    VALUES (NEW.user_id, NEW.release_id, 'collection_add');
  ELSIF NEW.type = 'wishlist' THEN
    INSERT INTO posts (user_id, vinyl_id, type)
    VALUES (NEW.user_id, NEW.release_id, 'wishlist_add');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FIN DE LA MIGRATION
-- ========================================