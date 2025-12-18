-- Add admin policies for mentor tables
-- Allows admins and super_admins to view all mentor records

CREATE POLICY "Admins can view all mentor_access"
  ON mentor_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
    )
  );

CREATE POLICY "Admins can view all mentor_invitations"
  ON mentor_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
    )
  );
