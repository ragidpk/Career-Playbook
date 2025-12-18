-- Migration: Fix case-insensitive email comparison in plan_collaborators
-- Description: Update RLS policy to use case-insensitive email matching

-- Drop and recreate the email-based policy with case-insensitive comparison
DROP POLICY IF EXISTS "Users can view invitations by email" ON plan_collaborators;

CREATE POLICY "Users can view invitations by email"
  ON plan_collaborators FOR SELECT
  USING (
    LOWER(collaborator_email) = LOWER((SELECT email FROM profiles WHERE id = auth.uid()))
  );
