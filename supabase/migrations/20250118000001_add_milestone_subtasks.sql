-- Migration: Add subtasks and category to weekly_milestones
-- Description: Enables structured milestone data with title, subtasks, and category

-- Add subtasks column (JSONB array of subtask objects)
-- Format: [{"text": "Subtask 1", "completed": false}, {"text": "Subtask 2", "completed": false}]
ALTER TABLE weekly_milestones
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- Add category column for milestone categorization
-- Values: foundation, skill_development, networking, job_search
ALTER TABLE weekly_milestones
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'foundation'
CHECK (category IN ('foundation', 'skill_development', 'networking', 'job_search'));

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_milestones_category ON weekly_milestones(category);

-- Comment for documentation
COMMENT ON COLUMN weekly_milestones.subtasks IS 'Array of subtask objects: [{text: string, completed: boolean}]';
COMMENT ON COLUMN weekly_milestones.category IS 'Milestone category: foundation, skill_development, networking, job_search';
