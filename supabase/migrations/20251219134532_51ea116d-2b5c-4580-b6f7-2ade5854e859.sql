-- =============================================
-- ENUMS
-- =============================================

-- Роли пользователей
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator');

-- Статусы заявок партнёров
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

-- Статусы профилей партнёров
CREATE TYPE public.partner_status AS ENUM ('active', 'inactive', 'archived');

-- Типы партнёров
CREATE TYPE public.partner_type AS ENUM ('star', 'paid', 'free');

-- Статусы заказов/вопросов
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'awaiting_partners', 'active', 'expired');

-- Типы динамических полей
CREATE TYPE public.field_type AS ENUM ('string', 'text', 'number', 'phone', 'url', 'select');

-- =============================================
-- ТАБЛИЦЫ
-- =============================================

-- Профили пользователей (Telegram)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'ru',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Роли пользователей (отдельная таблица для безопасности)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Категории
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Определения динамических полей
CREATE TABLE public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  label_en TEXT,
  field_type field_type NOT NULL DEFAULT 'string',
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  placeholder TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Заявки партнёров
CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  profession TEXT,
  city TEXT,
  agency_name TEXT,
  agency_description TEXT,
  self_description TEXT,
  phone TEXT,
  tg_channel TEXT,
  website TEXT,
  youtube TEXT,
  office_address TEXT,
  status application_status DEFAULT 'pending',
  rejection_reason TEXT,
  moderated_by UUID REFERENCES public.profiles(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Связь заявок партнёров с категориями
CREATE TABLE public.partner_application_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(application_id, category_id)
);

-- Профили партнёров (после одобрения)
CREATE TABLE public.partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.partner_applications(id),
  name TEXT NOT NULL,
  age INTEGER,
  profession TEXT,
  city TEXT,
  agency_name TEXT,
  agency_description TEXT,
  self_description TEXT,
  phone TEXT,
  tg_channel TEXT,
  website TEXT,
  youtube TEXT,
  office_address TEXT,
  status partner_status DEFAULT 'active',
  partner_type partner_type DEFAULT 'free',
  is_recommended BOOLEAN DEFAULT false,
  paid_until TIMESTAMPTZ,
  channel_post_id BIGINT,
  discussion_message_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Связь профилей партнёров с категориями
CREATE TABLE public.partner_profile_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(profile_id, category_id)
);

-- Значения динамических полей для партнёров
CREATE TABLE public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_profile_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  value TEXT,
  UNIQUE(partner_profile_id, field_definition_id)
);

-- Запросы на редактирование карточки партнёра
CREATE TABLE public.partner_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_profile_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  status application_status DEFAULT 'pending',
  rejection_reason TEXT,
  moderated_by UUID REFERENCES public.profiles(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Заказы
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  text TEXT NOT NULL,
  city TEXT,
  budget TEXT,
  contact TEXT,
  status request_status DEFAULT 'pending',
  rejection_reason TEXT,
  moderated_by UUID REFERENCES public.profiles(id),
  moderated_at TIMESTAMPTZ,
  actuality_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Публикации заказов под карточками партнёров
CREATE TABLE public.order_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_profile_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  message_id BIGINT,
  published_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, partner_profile_id)
);

-- Вопросы
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  text TEXT NOT NULL,
  details TEXT,
  status request_status DEFAULT 'pending',
  rejection_reason TEXT,
  moderated_by UUID REFERENCES public.profiles(id),
  moderated_at TIMESTAMPTZ,
  actuality_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Публикации вопросов под карточками партнёров
CREATE TABLE public.question_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  partner_profile_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  message_id BIGINT,
  published_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, partner_profile_id)
);

-- Платежи
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_profile_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'RUB',
  telegram_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  period_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Настройки системы
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Логи модерации
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES public.profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Статистика канала
CREATE TABLE public.channel_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  subscribers_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ИНДЕКСЫ
-- =============================================

CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX idx_partner_applications_user_id ON public.partner_applications(user_id);
CREATE INDEX idx_partner_profiles_status ON public.partner_profiles(status);
CREATE INDEX idx_partner_profiles_partner_type ON public.partner_profiles(partner_type);
CREATE INDEX idx_partner_profiles_paid_until ON public.partner_profiles(paid_until);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_category_id ON public.orders(category_id);
CREATE INDEX idx_questions_status ON public.questions(status);
CREATE INDEX idx_questions_category_id ON public.questions(category_id);

-- =============================================
-- ФУНКЦИИ
-- =============================================

-- Функция проверки роли (SECURITY DEFINER для избежания рекурсии в RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Функция получения profile_id по telegram_id
CREATE OR REPLACE FUNCTION public.get_profile_by_telegram_id(_telegram_id BIGINT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE telegram_id = _telegram_id LIMIT 1
$$;

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применение триггера к таблицам
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_field_definitions_updated_at BEFORE UPDATE ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_profiles_updated_at BEFORE UPDATE ON public.partner_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_application_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profile_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_stats ENABLE ROW LEVEL SECURITY;

-- Categories: публичное чтение
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Custom field definitions: публичное чтение
CREATE POLICY "Custom fields are viewable by everyone" ON public.custom_field_definitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage custom fields" ON public.custom_field_definitions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Settings: только админы
CREATE POLICY "Only admins can view settings" ON public.settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can manage settings" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Partner profiles: публичное чтение активных
CREATE POLICY "Active partner profiles are viewable by everyone" ON public.partner_profiles FOR SELECT USING (status = 'active');
CREATE POLICY "Moderators can view all partner profiles" ON public.partner_profiles FOR SELECT USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage partner profiles" ON public.partner_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Partner profile categories: публичное чтение
CREATE POLICY "Partner profile categories are viewable by everyone" ON public.partner_profile_categories FOR SELECT USING (true);
CREATE POLICY "Moderators can manage partner profile categories" ON public.partner_profile_categories FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Channel stats: только админы
CREATE POLICY "Only admins can view channel stats" ON public.channel_stats FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can manage channel stats" ON public.channel_stats FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Moderation logs: только админы
CREATE POLICY "Only admins can view moderation logs" ON public.moderation_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Moderators can insert moderation logs" ON public.moderation_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- =============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =============================================

-- Начальные категории
INSERT INTO public.categories (name, name_en, slug, sort_order) VALUES
  ('Avito', 'Avito', 'avito', 1),
  ('Дизайн', 'Design', 'design', 2),
  ('Юридические услуги', 'Legal Services', 'legal', 3),
  ('Таргетированная реклама', 'Targeted Advertising', 'targeting', 4),
  ('Создание сайтов', 'Web Development', 'websites', 5),
  ('SMM', 'SMM', 'smm', 6),
  ('SEO', 'SEO', 'seo', 7),
  ('Контекстная реклама', 'Contextual Advertising', 'context-ads', 8);

-- Начальные настройки
INSERT INTO public.settings (key, value, description) VALUES
  ('price_30_days', '5000', 'Цена платного размещения на 30 дней (руб)'),
  ('max_partners_per_order', '10', 'Максимум партнёров для публикации заказа'),
  ('max_partners_per_question', '10', 'Максимум партнёров для публикации вопроса'),
  ('order_actuality_days', '30', 'Период актуальности заказа (дней)'),
  ('question_actuality_days', '7', 'Период актуальности вопроса (дней)'),
  ('reminder_days_before', '3', 'За сколько дней напоминать об окончании');