-- Add Telegram settings to settings table
INSERT INTO public.settings (key, value, description) VALUES
('telegram_channel_id', '', 'ID Telegram-канала для публикации партнёров'),
('telegram_discussion_chat_id', '', 'ID чата обсуждений для комментариев'),
('telegram_admin_chat_id', '264133466', 'ID чата администратора для уведомлений')
ON CONFLICT (key) DO NOTHING;