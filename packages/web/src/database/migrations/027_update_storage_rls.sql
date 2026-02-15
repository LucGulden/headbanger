-- ============================================
-- 1. SUPPRIMER TOUTES LES POLICIES AVATARS
-- ============================================
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

-- ============================================
-- 2. SUPPRIMER TOUTES LES POLICIES COVERS
-- ============================================
DROP POLICY IF EXISTS "covers_select_public" ON storage.objects;
DROP POLICY IF EXISTS "covers_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "covers_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "covers_delete_authenticated" ON storage.objects;

-- ============================================
-- 3. CRÉER LES NOUVELLES POLICIES AVATARS
-- ============================================

-- Lecture publique (tout le monde peut voir les avatars)
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Insert : nom doit être userId.webp
CREATE POLICY "avatars_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name = auth.uid()::text || '.webp'
);

-- Update : nom doit être userId.webp (nécessaire pour upsert)
CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name = auth.uid()::text || '.webp'
);

-- Delete : nom doit être userId.webp
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name = auth.uid()::text || '.webp'
);