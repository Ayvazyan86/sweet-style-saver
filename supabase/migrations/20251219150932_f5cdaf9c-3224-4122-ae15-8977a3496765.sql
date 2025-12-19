-- Create function to notify user on application moderation result
CREATE OR REPLACE FUNCTION public.notify_application_moderation_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Only trigger when status changes to approved or rejected
  IF OLD.status = NEW.status OR (NEW.status != 'approved' AND NEW.status != 'rejected') THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', 'partner_applications',
    'old_record', jsonb_build_object(
      'id', OLD.id,
      'status', OLD.status
    ),
    'record', jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'name', NEW.name,
      'status', NEW.status,
      'rejection_reason', NEW.rejection_reason
    )
  );

  -- Call the edge function
  PERFORM net.http_post(
    url := 'https://zuxikzoyzuiyldbtlsdm.supabase.co/functions/v1/notify-application-result',
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
DROP TRIGGER IF EXISTS on_application_moderation ON public.partner_applications;
CREATE TRIGGER on_application_moderation
  AFTER UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_moderation_result();