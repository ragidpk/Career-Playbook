-- Migration to allow multiple career canvases per user
-- This removes the one_canvas_per_user constraint and adds necessary columns

-- 1. Drop the unique constraint that prevents multiple canvases
ALTER TABLE career_canvas DROP CONSTRAINT IF EXISTS one_canvas_per_user;

-- 2. Add name column for identifying canvases (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_canvas' AND column_name = 'name') THEN
    ALTER TABLE career_canvas ADD COLUMN name TEXT DEFAULT 'My Career Canvas';
  END IF;
END $$;

-- 3. Add order_index for sorting canvases (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_canvas' AND column_name = 'order_index') THEN
    ALTER TABLE career_canvas ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. Add linked_plan_id for connecting canvas to 90-day plan (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_canvas' AND column_name = 'linked_plan_id') THEN
    ALTER TABLE career_canvas ADD COLUMN linked_plan_id UUID REFERENCES ninety_day_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Add target_role for the career goal (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_canvas' AND column_name = 'target_role') THEN
    ALTER TABLE career_canvas ADD COLUMN target_role TEXT;
  END IF;
END $$;

-- 6. Create index on user_id and order_index for efficient queries
CREATE INDEX IF NOT EXISTS idx_canvas_user_order ON career_canvas(user_id, order_index);

-- 7. Update RLS policy to allow users to have multiple canvases
-- (The existing policy should already work since it's based on user_id match)
