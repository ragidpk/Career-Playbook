-- Migration: Create helper functions
-- Description: Reusable database functions for triggers

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: calculate_canvas_completion
CREATE OR REPLACE FUNCTION calculate_canvas_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completion_percentage := (
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_1_helpers, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_2_activities, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_3_value, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_4_interactions, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_5_convince, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_6_skills, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_7_motivation, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_8_sacrifices, ''))) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN LENGTH(TRIM(COALESCE(NEW.section_9_outcomes, ''))) > 0 THEN 1 ELSE 0 END)
  ) * 100 / 9;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: handle_new_user (auto-create profile on signup)
-- This prevents race conditions between signup and profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'job_seeker'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
