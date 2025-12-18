-- Migration: Create profiles_public table
-- Description: Safe public surface for profile display data (name, avatar)
-- This avoids exposing sensitive profile fields like email, role, is_admin

-- Create profiles_public table
CREATE TABLE IF NOT EXISTS profiles_public (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles_public ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read public profiles
CREATE POLICY "Authenticated users can read public profiles"
  ON profiles_public FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can only update their own public profile
CREATE POLICY "Users can update own public profile"
  ON profiles_public FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role can manage all
CREATE POLICY "Service role can manage profiles_public"
  ON profiles_public FOR ALL
  TO service_role
  USING (true);

-- Function to sync profiles_public with profiles
CREATE OR REPLACE FUNCTION sync_profiles_public()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles_public (id, full_name, avatar_url, updated_at)
  VALUES (NEW.id, NEW.full_name, NEW.avatar_url, NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-sync on profile changes
DROP TRIGGER IF EXISTS sync_profiles_public_trigger ON profiles;
CREATE TRIGGER sync_profiles_public_trigger
  AFTER INSERT OR UPDATE OF full_name, avatar_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profiles_public();

-- Populate profiles_public from existing profiles
INSERT INTO profiles_public (id, full_name, avatar_url, updated_at)
SELECT id, full_name, avatar_url, NOW()
FROM profiles
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_id ON profiles_public(id);
