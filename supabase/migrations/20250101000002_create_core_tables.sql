-- Migration: Create core tables
-- Description: User profiles, career canvas, plans, milestones, resume analyses, companies, AI usage tracking

-- 1. profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'mentor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. career_canvas table
CREATE TABLE career_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_1_helpers TEXT,
  section_2_activities TEXT,
  section_3_value TEXT,
  section_4_interactions TEXT,
  section_5_convince TEXT,
  section_6_skills TEXT,
  section_7_motivation TEXT,
  section_8_sacrifices TEXT,
  section_9_outcomes TEXT,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_canvas_per_user UNIQUE (user_id)
);

CREATE INDEX idx_canvas_user_id ON career_canvas(user_id);

CREATE TRIGGER update_canvas_updated_at
  BEFORE UPDATE ON career_canvas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER canvas_completion_trigger
  BEFORE INSERT OR UPDATE ON career_canvas
  FOR EACH ROW EXECUTE FUNCTION calculate_canvas_completion();

-- 3. ninety_day_plans table
CREATE TABLE ninety_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX idx_plans_user_id ON ninety_day_plans(user_id);
CREATE INDEX idx_plans_status ON ninety_day_plans(status);

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON ninety_day_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. weekly_milestones table
CREATE TABLE weekly_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ninety_day_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  goal TEXT NOT NULL CHECK (LENGTH(goal) <= 200),
  notes TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_plan_week UNIQUE (plan_id, week_number)
);

CREATE INDEX idx_milestones_plan_id ON weekly_milestones(plan_id);
CREATE INDEX idx_milestones_status ON weekly_milestones(status);
CREATE INDEX idx_milestones_order ON weekly_milestones(order_index);

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON weekly_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. resume_analyses table
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  strengths JSONB,
  gaps JSONB,
  recommendations JSONB,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX idx_analyses_date ON resume_analyses(analysis_date DESC);

-- 6. companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  status TEXT DEFAULT 'researching' CHECK (status IN ('researching', 'applied', 'interviewing', 'offer', 'rejected')),
  notes TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_date ON companies(date_added DESC);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. ai_usage_tracking table
CREATE TABLE ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('resume_analysis', 'linkedin_analysis', 'milestone_generation')),
  usage_month TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_feature_month UNIQUE (user_id, feature_type, usage_month)
);

CREATE INDEX idx_usage_user_feature ON ai_usage_tracking(user_id, feature_type);
CREATE INDEX idx_usage_month ON ai_usage_tracking(usage_month);

CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON ai_usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
