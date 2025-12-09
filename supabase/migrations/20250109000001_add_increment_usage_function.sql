-- Migration: Add increment_usage function
-- Description: Function to increment AI usage tracking

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_month TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE ai_usage_tracking
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_month = p_month;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO ai_usage_tracking (user_id, feature_type, usage_month, usage_count)
    VALUES (p_user_id, p_feature_type, p_month, 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
