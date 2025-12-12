-- ============================================
-- ADMIN ROLES - SCHEMA CHANGES
-- Add admin and super_admin roles to profiles
-- ============================================

-- Drop existing role constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with admin roles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('job_seeker', 'mentor', 'admin', 'super_admin'));

-- Add is_admin helper column for quick checks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role IN ('admin', 'super_admin') OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Super admins can update any profile's role
CREATE POLICY "Super admins can update profiles" ON profiles
FOR UPDATE USING (
  public.is_super_admin(auth.uid())
);

-- Admins can view all career_canvas entries
CREATE POLICY "Admins can view all career_canvas" ON career_canvas
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all ninety_day_plans
CREATE POLICY "Admins can view all ninety_day_plans" ON ninety_day_plans
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all weekly_milestones
CREATE POLICY "Admins can view all weekly_milestones" ON weekly_milestones
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all resume_analyses
CREATE POLICY "Admins can view all resume_analyses" ON resume_analyses
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all companies
CREATE POLICY "Admins can view all companies" ON companies
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Admins can view all ai_usage_tracking
CREATE POLICY "Admins can view all ai_usage" ON ai_usage_tracking
FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- ============================================
-- ASSIGN SUPER ADMIN TO ragid@live.com
-- ============================================
UPDATE profiles
SET role = 'super_admin', is_admin = TRUE
WHERE email = 'ragid@live.com';

-- ============================================
-- ADMIN STATS VIEW
-- ============================================
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_admin,
  p.created_at,
  p.updated_at,
  (SELECT COUNT(*) FROM ninety_day_plans WHERE user_id = p.id) as plan_count,
  (SELECT COUNT(*) FROM resume_analyses WHERE user_id = p.id) as resume_count,
  (SELECT COUNT(*) FROM companies WHERE user_id = p.id) as company_count,
  (SELECT COUNT(*) FROM career_canvas WHERE user_id = p.id) as canvas_count
FROM profiles p;

-- RLS for admin stats view
ALTER VIEW admin_user_stats SET (security_invoker = true);
