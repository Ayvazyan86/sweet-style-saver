-- Update notify_new_partner_application function to use current project URL
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

-- Update notify_application_moderation_result function to use current project URL
CREATE OR REPLACE FUNCTION public.notify_application_moderation_result()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Call the edge function on CURRENT project
  PERFORM net.http_post(
    url := 'https://ishzwulmiixtuouisdyw.supabase.co/functions/v1/notify-application-result',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;

-- Update notify_partners_new_order function to use current project URL
CREATE OR REPLACE FUNCTION public.notify_partners_new_order()
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
    'table', 'orders',
    'record', jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'category_id', NEW.category_id,
      'title', NEW.title,
      'text', NEW.text,
      'city', NEW.city,
      'budget', NEW.budget,
      'contact', NEW.contact,
      'created_at', NEW.created_at
    )
  );

  -- Call the edge function on CURRENT project
  PERFORM net.http_post(
    url := 'https://ishzwulmiixtuouisdyw.supabase.co/functions/v1/notify-partners-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;

-- Update notify_partners_new_question function to use current project URL
CREATE OR REPLACE FUNCTION public.notify_partners_new_question()
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
    'table', 'questions',
    'record', jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'category_id', NEW.category_id,
      'text', NEW.text,
      'details', NEW.details,
      'created_at', NEW.created_at
    )
  );

  -- Call the edge function on CURRENT project
  PERFORM net.http_post(
    url := 'https://ishzwulmiixtuouisdyw.supabase.co/functions/v1/notify-partners-new-question',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;