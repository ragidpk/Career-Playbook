-- Migration: Create relationship tables
-- Description: Mentor invitations and access control

-- mentor_invitations table
CREATE TABLE mentor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_email TEXT NOT NULL,
  mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_invitation UNIQUE (job_seeker_id, mentor_email)
);

CREATE INDEX idx_invitations_job_seeker ON mentor_invitations(job_seeker_id);
CREATE INDEX idx_invitations_mentor_email ON mentor_invitations(mentor_email);
CREATE INDEX idx_invitations_mentor_id ON mentor_invitations(mentor_id);
CREATE INDEX idx_invitations_status ON mentor_invitations(status);

-- mentor_access table
CREATE TABLE mentor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_mentor_access UNIQUE (job_seeker_id, mentor_id)
);

CREATE INDEX idx_access_job_seeker ON mentor_access(job_seeker_id);
CREATE INDEX idx_access_mentor ON mentor_access(mentor_id);
