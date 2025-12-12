-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs every minute
-- This will call the Supabase Edge Function to publish scheduled posts
SELECT cron.schedule(
    'publish-scheduled-posts',              -- Job name
    '* * * * *',                            -- Every minute
    $$
    SELECT
      net.http_post(
          url:='YOUR_SUPABASE_FUNCTION_URL/publish-scheduled-posts',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
      ) AS request_id;
    $$
);

-- To unschedule (if needed):
-- SELECT cron.unschedule('publish-scheduled-posts');

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

