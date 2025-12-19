-- Функция для уведомления партнёров о новых заказах
CREATE OR REPLACE FUNCTION public.notify_partners_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Вызываем edge function
  PERFORM net.http_post(
    url := 'https://zuxikzoyzuiyldbtlsdm.supabase.co/functions/v1/notify-partners-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eGlrem95enVpeWxkYnRsc2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ4MzEsImV4cCI6MjA4MTcyMDgzMX0.xgdHHjzuO8xeEglWP4Y9Ke4gaGN7scb3PKqDOdm8ICU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Функция для уведомления партнёров о новых вопросах
CREATE OR REPLACE FUNCTION public.notify_partners_new_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Вызываем edge function
  PERFORM net.http_post(
    url := 'https://zuxikzoyzuiyldbtlsdm.supabase.co/functions/v1/notify-partners-new-question',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eGlrem95enVpeWxkYnRsc2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ4MzEsImV4cCI6MjA4MTcyMDgzMX0.xgdHHjzuO8xeEglWP4Y9Ke4gaGN7scb3PKqDOdm8ICU'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Создаём триггер для заказов
CREATE TRIGGER on_new_order_notify_partners
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partners_new_order();

-- Создаём триггер для вопросов
CREATE TRIGGER on_new_question_notify_partners
  AFTER INSERT ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partners_new_question();