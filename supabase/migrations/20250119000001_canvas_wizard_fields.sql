-- Migration: Add current_role and target_date columns for Career Canvas wizard flow

-- Add current_role column for storing user's current position
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_canvas' AND column_name = 'current_role') THEN
    ALTER TABLE career_canvas ADD COLUMN current_role TEXT;
  END IF;
END $$;

-- Add target_date column for career goal timeline
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_canvas' AND column_name = 'target_date') THEN
    ALTER TABLE career_canvas ADD COLUMN target_date DATE;
  END IF;
END $$;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_canvas_target_date ON career_canvas(target_date);
