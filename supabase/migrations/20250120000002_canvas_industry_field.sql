-- Add industry column to career_canvas table
ALTER TABLE career_canvas ADD COLUMN IF NOT EXISTS industry TEXT;

COMMENT ON COLUMN career_canvas.industry IS 'Target industry for this career goal';
