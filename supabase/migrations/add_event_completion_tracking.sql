-- ============================================
-- EVENT COMPLETION TRACKING
-- ============================================
-- Adds completion tracking fields to event_participants table

-- Add completion_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_participants' 
    AND column_name = 'completion_status'
  ) THEN
    ALTER TABLE event_participants 
    ADD COLUMN completion_status TEXT DEFAULT 'in_progress' 
    CHECK (completion_status IN ('in_progress', 'completed', 'not_started'));
  END IF;
END $$;

-- Add progress_data column if it doesn't exist (JSONB for flexible progress tracking)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_participants' 
    AND column_name = 'progress_data'
  ) THEN
    ALTER TABLE event_participants 
    ADD COLUMN progress_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for completion_status
CREATE INDEX IF NOT EXISTS idx_event_participants_completion_status 
ON event_participants(completion_status);

-- Add index for progress_data (GIN index for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_event_participants_progress_data 
ON event_participants USING GIN (progress_data);

-- Add comment
COMMENT ON COLUMN event_participants.completion_status IS 'Completion status: in_progress, completed, not_started';
COMMENT ON COLUMN event_participants.progress_data IS 'JSONB field storing course progress, completed modules, etc.';

