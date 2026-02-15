-- ========================================
-- CORRECTION COMPLÈTE : Search Path pour toutes les fonctions
-- ========================================

-- ========================================
-- 1. cleanup_old_notifications
-- ========================================
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < now() - INTERVAL '30 days';
END;
$function$;

-- ========================================
-- 2. notify_new_follower
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Ne pas notifier si quelqu'un se suit soi-même
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  -- Créer une notification pour la personne suivie
  INSERT INTO public.notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'new_follower', NEW.follower_id)
  ON CONFLICT (user_id, type, actor_id, post_id, comment_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ========================================
-- 3. notify_post_like
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  post_author_id UUID;
BEGIN
  -- Récupérer l'auteur du post
  SELECT user_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Ne pas notifier si on like son propre post
  IF NEW.user_id = post_author_id THEN
    RETURN NEW;
  END IF;

  -- Créer une notification pour l'auteur du post
  INSERT INTO public.notifications (user_id, type, actor_id, post_id)
  VALUES (post_author_id, 'post_like', NEW.user_id, NEW.post_id)
  ON CONFLICT (user_id, type, actor_id, post_id, comment_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ========================================
-- 4. notify_post_comment
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  post_author_id UUID;
BEGIN
  -- Récupérer l'auteur du post
  SELECT user_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Ne pas notifier si on commente son propre post
  IF NEW.user_id = post_author_id THEN
    RETURN NEW;
  END IF;

  -- Créer une notification pour l'auteur du post
  INSERT INTO public.notifications (user_id, type, actor_id, post_id, comment_id)
  VALUES (post_author_id, 'post_comment', NEW.user_id, NEW.post_id, NEW.id)
  ON CONFLICT (user_id, type, actor_id, post_id, comment_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ========================================
-- 5. delete_follower_notification
-- ========================================
CREATE OR REPLACE FUNCTION public.delete_follower_notification()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = OLD.following_id
    AND type = 'new_follower'
    AND actor_id = OLD.follower_id;
  
  RETURN OLD;
END;
$function$;

-- ========================================
-- 6. delete_like_notification
-- ========================================
CREATE OR REPLACE FUNCTION public.delete_like_notification()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.notifications
  WHERE type = 'post_like'
    AND actor_id = OLD.user_id
    AND post_id = OLD.post_id;
  
  RETURN OLD;
END;
$function$;

-- ========================================
-- 7. delete_comment_notification
-- ========================================
CREATE OR REPLACE FUNCTION public.delete_comment_notification()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.notifications
  WHERE type = 'post_comment'
    AND comment_id = OLD.id;
  
  RETURN OLD;
END;
$function$;

-- ========================================
-- 8. create_post_on_vinyl_add
-- ========================================
CREATE OR REPLACE FUNCTION public.create_post_on_vinyl_add()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Créer un post pour collection_add ou wishlist_add
  IF NEW.type = 'collection' THEN
    INSERT INTO public.posts (user_id, vinyl_id, type)
    VALUES (NEW.user_id, NEW.release_id, 'collection_add');
  ELSIF NEW.type = 'wishlist' THEN
    INSERT INTO public.posts (user_id, vinyl_id, type)
    VALUES (NEW.user_id, NEW.release_id, 'wishlist_add');
  END IF;
  RETURN NEW;
END;
$function$;

-- ========================================
-- 9. update_updated_at_column
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ========================================
-- 10. SUPPRIMER LA POLICY TROP PERMISSIVE
-- ========================================

-- Les triggers ont SECURITY DEFINER, cette policy n'est pas nécessaire
DROP POLICY IF EXISTS "authenticated_insert_notifications" ON notifications;

-- ========================================
-- FIN DE LA CORRECTION
-- ========================================