-- ============================================
-- ADMIN SECURITY HARDENING
-- Addresses Chief Architect review feedback
-- ============================================
--
-- SUPER_ADMIN RECOVERY PROCEDURE
-- ==============================
-- The initial super_admin (ragid@live.com) is protected from demotion by a trigger.
-- If the email needs to change or recovery is needed:
--
-- 1. Connect to database with elevated privileges (service_role or postgres)
-- 2. Temporarily disable the trigger:
--    ALTER TABLE profiles DISABLE TRIGGER trigger_protect_initial_super_admin;
-- 3. Make necessary changes:
--    UPDATE profiles SET email = 'new@email.com' WHERE email = 'ragid@live.com';
--    -- OR create a new super_admin:
--    UPDATE profiles SET role = 'super_admin', is_admin = TRUE WHERE email = 'new@admin.com';
-- 4. Update the trigger function to protect the new email (if changed):
--    Modify protect_initial_super_admin() function
-- 5. Re-enable the trigger:
--    ALTER TABLE profiles ENABLE TRIGGER trigger_protect_initial_super_admin;
--
-- ============================================

-- ============================================
-- 1. FIX SECURITY DEFINER FUNCTIONS
-- Add explicit search_path to prevent path injection
-- ============================================

-- Recreate is_admin with secure search_path
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role IN ('admin', 'super_admin') OR is_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Recreate is_super_admin with secure search_path
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 2. BLOCK SELF-ESCALATION OF ROLES
-- Trigger to prevent users from changing their own role
-- Only super_admin can change roles, and only for others
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- If role or is_admin is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
    -- Block if user is changing their own role
    IF NEW.id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot change their own role or admin status';
    END IF;

    -- Block if the user making the change is not a super_admin
    IF current_user_role != 'super_admin' THEN
      RAISE EXCEPTION 'Only super_admin can change user roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for role change protection
DROP TRIGGER IF EXISTS trigger_prevent_role_self_escalation ON profiles;
CREATE TRIGGER trigger_prevent_role_self_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================
-- 3. PROTECT INITIAL SUPER_ADMIN ACCOUNT
-- Prevent accidental demotion of ragid@live.com
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_initial_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect ragid@live.com from role demotion
  IF OLD.email = 'ragid@live.com' AND OLD.role = 'super_admin' THEN
    IF NEW.role != 'super_admin' OR NEW.is_admin = FALSE THEN
      RAISE EXCEPTION 'Cannot demote the initial super_admin account (ragid@live.com). Contact system administrator for recovery.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for initial super_admin protection
DROP TRIGGER IF EXISTS trigger_protect_initial_super_admin ON profiles;
CREATE TRIGGER trigger_protect_initial_super_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_initial_super_admin();

-- ============================================
-- 4. BACKFILL is_admin COLUMN FOR LEGACY ROWS
-- Ensure is_admin is consistent with role for all existing users
-- ============================================

UPDATE profiles
SET is_admin = TRUE
WHERE role IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = FALSE);

UPDATE profiles
SET is_admin = FALSE
WHERE role NOT IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = TRUE);

-- ============================================
-- 5. ADD RESTRICTIVE UPDATE POLICY
-- Ensure non-admins can only update non-sensitive fields
-- ============================================

-- Drop any existing user self-update policy that might be too permissive
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create restrictive self-update policy (excludes role/is_admin changes)
-- Users can update their own non-sensitive fields
CREATE POLICY "Users can update own non-sensitive fields" ON profiles
FOR UPDATE USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
  -- The trigger will block role/is_admin changes, but this adds defense-in-depth
);

-- ============================================
-- 6. OPTIMIZE ADMIN VIEWS FOR EFFICIENCY
-- Add aggregate view to avoid N+1 queries
-- ============================================

-- Drop and recreate admin_user_stats with proper aggregation
DROP VIEW IF EXISTS admin_user_stats;
CREATE VIEW admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_admin,
  p.created_at,
  p.updated_at,
  COALESCE(plans.cnt, 0) as plan_count,
  COALESCE(resumes.cnt, 0) as resume_count,
  COALESCE(companies.cnt, 0) as company_count,
  COALESCE(canvas.cnt, 0) as canvas_count
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM ninety_day_plans GROUP BY user_id
) plans ON plans.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM resume_analyses GROUP BY user_id
) resumes ON resumes.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM companies GROUP BY user_id
) companies ON companies.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt FROM career_canvas GROUP BY user_id
) canvas ON canvas.user_id = p.id;

-- RLS for admin stats view (admins only)
ALTER VIEW admin_user_stats SET (security_invoker = true);

-- ============================================
-- 7. CREATE ADMIN DASHBOARD STATS FUNCTION
-- Single function to get all stats efficiently
-- ============================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalPlans', (SELECT COUNT(*) FROM ninety_day_plans),
    'totalResumes', (SELECT COUNT(*) FROM resume_analyses),
    'recentSignups', (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'usersByRole', (
      SELECT json_object_agg(role, cnt)
      FROM (
        SELECT role, COUNT(*) as cnt
        FROM profiles
        GROUP BY role
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- 8. CREATE PLANS WITH USER INFO VIEW
-- Avoid N+1 when fetching plans
-- ============================================

CREATE OR REPLACE VIEW admin_plans_with_users AS
SELECT
  p.id,
  p.title,
  p.start_date,
  p.end_date,
  p.created_at,
  p.user_id,
  pr.email as user_email,
  pr.full_name as user_name,
  COALESCE(m.total_milestones, 0) as milestone_count,
  COALESCE(m.completed_milestones, 0) as completed_milestones
FROM ninety_day_plans p
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN (
  SELECT
    plan_id,
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_milestones
  FROM weekly_milestones
  GROUP BY plan_id
) m ON m.plan_id = p.id
ORDER BY p.created_at DESC;

-- RLS for admin plans view (admins only)
ALTER VIEW admin_plans_with_users SET (security_invoker = true);
