-- Career Playbook: Multi-Canvas Migration
-- Run this in Supabase SQL Editor to enable multiple canvases per user

-- Step 1: Remove the unique constraint that limits users to one canvas
ALTER TABLE career_canvas DROP CONSTRAINT IF EXISTS one_canvas_per_user;

-- Also try alternate constraint names that might exist
ALTER TABLE career_canvas DROP CONSTRAINT IF EXISTS career_canvas_user_id_key;

-- Step 2: Create an index for efficient queries by user and order
CREATE INDEX IF NOT EXISTS idx_career_canvas_user_order
ON career_canvas(user_id, order_index);

-- Step 3: Verify the constraint was removed (should return empty)
SELECT conname
FROM pg_constraint
WHERE conrelid = 'career_canvas'::regclass
AND contype = 'u';
