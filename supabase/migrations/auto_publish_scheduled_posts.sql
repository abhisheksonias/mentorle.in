-- Create a function to auto-publish scheduled posts
CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS INTEGER AS $$
DECLARE
  published_count INTEGER;
BEGIN
  -- Update scheduled posts where published_at has passed
  WITH updated AS (
    UPDATE posts
    SET status = 'published'
    WHERE status = 'scheduled'
      AND published_at <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO published_count FROM updated;
  
  RETURN published_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every minute
SELECT cron.schedule(
  'auto-publish-scheduled-posts',
  '* * * * *', -- Every minute
  'SELECT auto_publish_scheduled_posts();'
);

-- To check if the job is running:
-- SELECT * FROM cron.job;

-- To see job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To unschedule (if needed):
-- SELECT cron.unschedule('auto-publish-scheduled-posts');

