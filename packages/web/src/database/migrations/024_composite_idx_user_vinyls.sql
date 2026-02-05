-- Créer l'index composite optimisé
CREATE INDEX idx_user_vinyls_pagination 
ON user_vinyls(user_id, type, added_at DESC);

-- Optionnel : Supprimer les anciens index redondants
-- (Postgres peut utiliser l'index composite pour ces cas aussi)
DROP INDEX IF EXISTS idx_user_releases_user_id;
DROP INDEX IF EXISTS idx_user_releases_type;
DROP INDEX IF EXISTS idx_user_releases_added_at;