-- Policy INSERT pour les notifications
CREATE POLICY "notifications_create_by_actor"
ON "public"."notifications"
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = actor_id
);

-- Policy DELETE pour les notifications
CREATE POLICY "notifications_delete_by_actor"
ON "public"."notifications"
FOR DELETE
TO public
USING (
  auth.uid() = actor_id
);

CREATE POLICY "notifications_select_recipient_or_actor"
ON "public"."notifications"
FOR SELECT
TO public
USING (
  auth.uid() = user_id OR auth.uid() = actor_id
);