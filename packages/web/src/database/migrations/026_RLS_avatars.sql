-- 1. Lecture publique (tout le monde peut voir les avatars)
CREATE POLICY "avatars_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. Insert : le nom du fichier doit être auth.uid().webp
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND name = auth.uid()::text || '.webp'
);

-- 3. Update : même règle (nécessaire pour upsert)
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND name = auth.uid()::text || '.webp'
);

-- 4. Delete : seul le proprio peut supprimer son avatar
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND name = auth.uid()::text || '.webp'
);