-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify on new applications
CREATE OR REPLACE FUNCTION public.notify_new_partner_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'partner_applications',
    'record', jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'phone', NEW.phone,
      'city', NEW.city,
      'profession', NEW.profession,
      'created_at', NEW.created_at
    )
  );

  -- Call the edge function
  PERFORM net.http_post(
    url := 'https://zuxikzoyzuiyldbtlsdm.supabase.co/functions/v1/notify-new-application',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eGlrem95enVpeWxkYnRsc2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ4MzEsImV4cCI6MjA4MTcyMDgzMX0.xgdHHjzuO8xeEglWP4Y9Ke4gaGN7scb3PKqDOdm8ICU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_partner_application ON public.partner_applications;
CREATE TRIGGER on_new_partner_application
  AFTER INSERT ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_partner_application();