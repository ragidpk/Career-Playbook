-- Create plan_collaborators table
CREATE TABLE IF NOT EXISTS plan_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ninety_day_plans(id) ON DELETE CASCADE,
  collaborator_email TEXT NOT NULL,
  collaborator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'accountability_partner')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  personal_message TEXT,
  invitation_token_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(plan_id, collaborator_email)
);

-- Enable RLS
ALTER TABLE plan_collaborators ENABLE ROW LEVEL SECURITY;

-- Plan owners can manage collaborators
CREATE POLICY "Plan owners can manage collaborators"
  ON plan_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ninety_day_plans
      WHERE ninety_day_plans.id = plan_collaborators.plan_id
      AND ninety_day_plans.user_id = auth.uid()
    )
  );

-- Collaborators can view their own invitations
CREATE POLICY "Collaborators can view own invitations"
  ON plan_collaborators FOR SELECT
  USING (collaborator_id = auth.uid());

-- Users can view invitations by email
CREATE POLICY "Users can view invitations by email"
  ON plan_collaborators FOR SELECT
  USING (
    collaborator_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Admins can view all
CREATE POLICY "Admins can view all plan_collaborators"
  ON plan_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_plan_id ON plan_collaborators(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_collaborator_id ON plan_collaborators(collaborator_id);
