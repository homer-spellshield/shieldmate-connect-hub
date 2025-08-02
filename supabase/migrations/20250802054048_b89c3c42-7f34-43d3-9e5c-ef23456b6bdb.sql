-- Set up cron job to run enforce-mission-closure daily at midnight
SELECT cron.schedule(
    'auto-close-missions',
    '0 0 * * *', -- Daily at midnight UTC
    $$
    SELECT net.http_post(
        url := 'https://zxmxfyzwqyawebnrmnku.supabase.co/functions/v1/enforce-mission-closure',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4bXhmeXp3cXlhd2VibnJtbmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDg4NDQsImV4cCI6MjA2NzM4NDg0NH0.K8rcbOjZCdenK2nXjkyPO2w2sNrr1Pdc9V9DSMrXI0U"}'::jsonb,
        body := '{"automated": true}'::jsonb
    ) as request_id;
    $$
);