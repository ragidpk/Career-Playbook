-- Migration: Atomic rate limit function
-- Description: Atomic increment with limit check to prevent race conditions

CREATE OR REPLACE FUNCTION increment_usage_with_limit(
  p_user_id UUID,
  p_feature_type TEXT,
  p_month TEXT,
  p_limit INTEGER
)
RETURNS TABLE(success BOOLEAN, usage_count INTEGER) AS $$
DECLARE
  v_new_count INTEGER;
  v_existing_count INTEGER;
BEGIN
  -- Try to update existing record atomically
  UPDATE ai_usage_tracking
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_month = p_month
    AND usage_count < p_limit
  RETURNING ai_usage_tracking.usage_count INTO v_new_count;

  -- If update succeeded, return the new count
  IF FOUND THEN
    RETURN QUERY SELECT true, v_new_count;
    RETURN;
  END IF;

  -- Check if record exists but is at limit
  SELECT ai_usage_tracking.usage_count INTO v_existing_count
  FROM ai_usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_month = p_month;

  -- If record exists and at/over limit, return failure
  IF FOUND THEN
    RETURN QUERY SELECT false, v_existing_count;
    RETURN;
  END IF;

  -- No record exists, create one with count = 1
  BEGIN
    INSERT INTO ai_usage_tracking (user_id, feature_type, usage_month, usage_count)
    VALUES (p_user_id, p_feature_type, p_month, 1)
    RETURNING ai_usage_tracking.usage_count INTO v_new_count;

    RETURN QUERY SELECT true, v_new_count;
    RETURN;
  EXCEPTION
    WHEN unique_violation THEN
      -- Race condition: another request created the record
      -- Retry the update
      UPDATE ai_usage_tracking
      SET usage_count = usage_count + 1
      WHERE user_id = p_user_id
        AND feature_type = p_feature_type
        AND usage_month = p_month
        AND usage_count < p_limit
      RETURNING ai_usage_tracking.usage_count INTO v_new_count;

      IF FOUND THEN
        RETURN QUERY SELECT true, v_new_count;
      ELSE
        -- At limit after race condition
        SELECT ai_usage_tracking.usage_count INTO v_existing_count
        FROM ai_usage_tracking
        WHERE user_id = p_user_id
          AND feature_type = p_feature_type
          AND usage_month = p_month;

        RETURN QUERY SELECT false, v_existing_count;
      END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION increment_usage_with_limit IS 'Atomically increments usage count if under limit, prevents race conditions';
