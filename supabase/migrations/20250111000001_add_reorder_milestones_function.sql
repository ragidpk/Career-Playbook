-- Migration: Add atomic reorder_milestones function
-- This function updates milestone order_index values atomically in a single transaction
-- Prevents race conditions when multiple updates would otherwise use Promise.all

CREATE OR REPLACE FUNCTION reorder_milestones(
  milestone_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_record jsonb;
  milestone_id uuid;
  new_order int;
BEGIN
  -- Validate input
  IF milestone_updates IS NULL OR jsonb_array_length(milestone_updates) = 0 THEN
    RAISE EXCEPTION 'milestone_updates cannot be empty';
  END IF;

  -- Iterate through each update and apply atomically
  FOR update_record IN SELECT * FROM jsonb_array_elements(milestone_updates)
  LOOP
    milestone_id := (update_record->>'id')::uuid;
    new_order := (update_record->>'order_index')::int;

    -- Verify the milestone belongs to a plan owned by the current user
    IF NOT EXISTS (
      SELECT 1 FROM weekly_milestones wm
      JOIN ninety_day_plans p ON wm.plan_id = p.id
      WHERE wm.id = milestone_id AND p.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Milestone % not found or access denied', milestone_id;
    END IF;

    -- Update the order_index
    UPDATE weekly_milestones
    SET order_index = new_order, updated_at = now()
    WHERE id = milestone_id;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_milestones(jsonb) TO authenticated;

COMMENT ON FUNCTION reorder_milestones IS 'Atomically reorder milestones within a plan. Takes array of {id, order_index} objects.';
