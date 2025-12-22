-- ============================================
-- Allow authenticated users to insert external jobs
-- Needed for saving AI-generated search results
-- ============================================

DO $$
BEGIN
  -- Create INSERT policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'external_jobs'
    AND policyname = 'Authenticated users can insert external jobs'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert external jobs" ON external_jobs FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;

  -- Create UPDATE policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'external_jobs'
    AND policyname = 'Authenticated users can update external jobs'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update external jobs" ON external_jobs FOR UPDATE TO authenticated USING (true)';
  END IF;
END
$$;
