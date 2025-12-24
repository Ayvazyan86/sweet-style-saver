-- Update notify_new_partner_application function to include photo and template
CREATE OR REPLACE FUNCTION public.notify_new_partner_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'photo_url', NEW.photo_url,
      'card_template_id', NEW.card_template_id,
      'created_at', NEW.created_at
    )
  );

  -- Call the edge function on CURRENT project
  PERFORM net.http_post(
    url := 'https://ishzwulmiixtuouisdyw.supabase.co/functions/v1/notify-new-application',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;