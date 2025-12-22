-- AI Prompts table for storing editable AI prompts
CREATE TABLE IF NOT EXISTS ai_prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  max_tokens INTEGER NOT NULL DEFAULT 500,
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prompts_updated_at();

-- RLS policies
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Only admins can view prompts
CREATE POLICY "Admins can view ai_prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only super_admins can modify prompts
CREATE POLICY "Super admins can insert ai_prompts"
  ON ai_prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update ai_prompts"
  ON ai_prompts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete ai_prompts"
  ON ai_prompts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Service role can always access (for edge functions)
CREATE POLICY "Service role full access to ai_prompts"
  ON ai_prompts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default prompts
INSERT INTO ai_prompts (id, name, description, model, max_tokens, temperature, system_prompt, user_prompt_template) VALUES
(
  'canvas-ai-suggestion',
  'Career Canvas AI Suggestion',
  'Generates personalized answers for Career Canvas questions based on career transition goals.',
  'gpt-4o-mini',
  500,
  0.7,
  'You are an expert career coach. Provide helpful, personalized career advice.',
  E'You are an expert career coach helping someone transition from "{currentRole}" to "{targetRole}".\n\nThe user needs to answer this career canvas question:\n"{questionText}"\n\n{previousAnswersContext}\n\nGenerate a thoughtful, personalized response for this person. The response should:\n1. Be written in first person ("I", "my")\n2. Be specific to transitioning from {currentRole} to {targetRole}\n3. Be actionable and practical\n4. Be 150-250 words\n5. Sound natural and authentic, not generic\n\nRespond with just the suggestion text, no preamble or explanation.'
),
(
  'generate-milestones',
  '90-Day Plan Milestone Generator',
  'Creates a structured 12-week action plan with weekly milestones and subtasks based on Career Canvas data.',
  'gpt-4o-mini',
  2000,
  0.7,
  'You are an expert career coach. Always respond with valid JSON only.',
  E'You are a career coach helping someone create a 12-week (90-day) action plan based on their Career Canvas.\n\nBased on the following Career Canvas information, generate 12 weekly milestones that will help this person achieve their career goals.\n\nCareer Canvas:\n{canvasContext}\n\nGenerate exactly 12 weekly milestones. Each milestone should have:\n1. A short title (2-4 words) describing the week''s focus\n2. Exactly 3 specific, actionable subtasks that can be completed that week\n3. A category that matches the phase of the career journey\n\nCategories should follow this progression:\n- Weeks 1-3: "foundation" (research, self-assessment, learning basics)\n- Weeks 4-6: "skill_development" (building skills, certifications, practice)\n- Weeks 7-9: "networking" (connecting, outreach, building relationships)\n- Weeks 10-12: "job_search" (applications, interviews, negotiations)\n\nRespond ONLY with valid JSON in this exact format:\n{\n  "milestones": [\n    {\n      "week": 1,\n      "title": "PM Foundations",\n      "subtasks": ["Read ''Inspired'' by Marty Cagan", "Complete PM skills assessment", "Identify skill gaps"],\n      "category": "foundation"\n    }\n  ]\n}\n\nMake subtasks specific, measurable, and achievable within a single week.'
),
(
  'analyze-resume',
  'Resume ATS Analysis',
  'Comprehensive resume analysis including ATS score, strengths, gaps, and 90-day job search strategy.',
  'gpt-4o-mini',
  3000,
  0.7,
  'You are an expert career counselor and ATS analyzer specializing in the {targetCountry} job market. Always respond with valid JSON only. Be specific, professional, and constructive.',
  E'You are a professional career counselor and resume expert specializing in the {targetCountry} job market. Analyze the uploaded resume and provide detailed, constructive feedback in JSON format with the following structure:\n\n{\n  "candidate_name": "Full name of the candidate as found in the resume",\n  "ats_score": <number between 0-100>,\n  "summary": "A brief 2-3 sentence overview of the candidate''s profile",\n  "experience_level": "Entry-level/Mid-level/Senior/Executive",\n  "strengths": ["Array of 3-5 key strengths identified in the resume"],\n  "improvements": ["Array of 3-5 specific areas for improvement"],\n  "skills_identified": ["Array of all technical and soft skills found"],\n  "recommendations": ["Array of 3-5 actionable recommendations to improve the resume"],\n  "role_recommendations": ["Array of 3-5 specific job roles suitable for this candidate in the {targetCountry} market"],\n  "job_search_approach": ["Array of 5-7 strategic recommendations for approaching job opportunities in {targetCountry}"],\n  "ninety_day_strategy": {\n    "overview": "Brief overview of the 90-day plan",\n    "weeks_1_4": ["Array of 4-5 specific action items for weeks 1-4 (Foundation Phase)"],\n    "weeks_5_8": ["Array of 4-5 specific action items for weeks 5-8 (Development Phase)"],\n    "weeks_9_12": ["Array of 4-5 specific action items for weeks 9-12 (Implementation Phase)"]\n  }\n}\n\nIMPORTANT: Extract the candidate''s full name from the resume.\n\nBe specific, professional, and constructive in your feedback. Focus on the {targetCountry} job market context.\n\nResume content:\n{resumeText}\n\nRespond ONLY with valid JSON matching the structure above.'
),
(
  'improve-summary',
  'Resume Summary Improver',
  'Enhances professional summary sections of resumes to be more impactful and ATS-friendly.',
  'gpt-4o-mini',
  500,
  0.7,
  E'You are an expert resume writer and career coach. Your task is to improve professional summaries for resumes.\n\nRules:\n- Keep it concise: 2-3 impactful sentences\n- Start with years of experience and main expertise\n- Highlight key achievements and skills\n- Use action-oriented language\n- Make it ATS-friendly (avoid tables, graphics references)\n- Don''t use first person pronouns (I, my)\n- Focus on value the candidate brings to employers',
  E'Improve this professional summary:\n\n"{content}"\n\nProvide only the improved summary, nothing else.'
),
(
  'improve-bullet',
  'Resume Bullet Point Improver',
  'Transforms job responsibilities into impactful achievement statements.',
  'gpt-4o-mini',
  500,
  0.7,
  E'You are an expert resume writer. Your task is to transform job responsibilities into impactful achievement statements.\n\nRules:\n- Start with a strong action verb (Led, Developed, Increased, etc.)\n- Include quantifiable metrics when possible (%, $, time saved)\n- Show the impact/result of the action\n- Keep it to one concise sentence\n- Make it ATS-friendly\n- Focus on achievements, not just duties',
  E'Transform this job bullet point into an impactful achievement:\n{contextInfo}\n\n"{content}"\n\nProvide only the improved bullet point, nothing else.'
)
ON CONFLICT (id) DO NOTHING;
