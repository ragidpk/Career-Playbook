-- Migration: Add continuation plan support
-- Description: Allows users to create follow-up 12-week plans that continue from a previous plan

-- Add parent_plan_id column to ninety_day_plans table
ALTER TABLE ninety_day_plans ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES ninety_day_plans(id) ON DELETE SET NULL;

-- Add index for faster lookups of continuation plans
CREATE INDEX IF NOT EXISTS idx_plans_parent_id ON ninety_day_plans(parent_plan_id);

-- Add sequence_number to track which plan in the sequence (1 = original, 2 = first continuation, etc.)
ALTER TABLE ninety_day_plans ADD COLUMN IF NOT EXISTS sequence_number INTEGER DEFAULT 1;

-- Comment explaining the continuation plan system
COMMENT ON COLUMN ninety_day_plans.parent_plan_id IS 'References the previous plan in a continuation sequence. NULL for original plans.';
COMMENT ON COLUMN ninety_day_plans.sequence_number IS 'Position in the plan sequence. 1 = original plan, 2+ = continuation plans.';
