-- Migration: Update handle_new_user to capture Google avatar
-- Description: Sync avatar_url from Google OAuth on first signup

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with avatar_url support
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Google OAuth provides avatar in 'avatar_url' or 'picture' field
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    'job_seeker'
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only update avatar if current is NULL (first signup behavior)
    avatar_url = CASE
      WHEN profiles.avatar_url IS NULL
      THEN COALESCE(
        EXCLUDED.avatar_url,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      )
      ELSE profiles.avatar_url
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
