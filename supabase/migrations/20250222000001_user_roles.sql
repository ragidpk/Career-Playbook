-- Create user_roles table for multi-role support
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('job_seeker', 'mentor', 'admin', 'super_admin')),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create index for fast lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage user roles
CREATE POLICY "Super admins can manage user roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Migrate existing roles to user_roles table
INSERT INTO user_roles (user_id, role, assigned_at)
SELECT id, role, created_at
FROM profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to get user roles as array
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role FROM user_roles
    WHERE user_id = p_user_id
    ORDER BY
      CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'mentor' THEN 3
        ELSE 4
      END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_user_stats view to include roles array
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  COALESCE(get_user_roles(p.id), ARRAY[p.role]::TEXT[]) as roles,
  p.is_admin,
  p.created_at,
  p.updated_at,
  p.resume_analysis_limit,
  COALESCE(plan_counts.count, 0) as plan_count,
  COALESCE(resume_counts.count, 0) as resume_count,
  COALESCE(company_counts.count, 0) as company_count,
  COALESCE(canvas_counts.count, 0) as canvas_count
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as count FROM ninety_day_plans GROUP BY user_id
) plan_counts ON plan_counts.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count FROM resume_analyses GROUP BY user_id
) resume_counts ON resume_counts.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count FROM companies GROUP BY user_id
) company_counts ON company_counts.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count FROM career_canvas GROUP BY user_id
) canvas_counts ON canvas_counts.user_id = p.id;
