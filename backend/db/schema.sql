
-- Полная схема базы данных Sweet Style Saver
-- Экспортировано из Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.partner_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE public.partner_type AS ENUM ('star', 'paid', 'free');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'awaiting_partners', 'active', 'expired');
CREATE TYPE public.field_type AS ENUM ('string', 'text', 'number', 'phone', 'url', 'select');

-- Таблица: categories
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Таблица: professions
CREATE TABLE public.professions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Таблица: settings
CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text NOT NULL UNIQUE,
    value text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Таблица: card_templates
CREATE TABLE public.card_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    image_url text,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Таблица: partner_applications
CREATE TABLE public.partner_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id bigint,
    name text NOT NULL,
    age integer,
    profession text,
    city text,
    phone text,
    photo_url text,
    logo_url text,
    agency_name text,
    agency_description text,
    self_description text,
    tg_channel text,
    website text,
    youtube text,
    rutube text,
    dzen text,
    vk_video text,
    office_address text,
    card_template_id uuid REFERENCES public.card_templates(id) ON DELETE SET NULL,
    status public.application_status DEFAULT 'pending',
    rejection_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Таблица: partner_profiles
CREATE TABLE public.partner_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.partner_applications(id) ON DELETE CASCADE,
    user_id bigint,
    name text NOT NULL,
    age integer,
    profession text,
    city text,
    phone text,
    tg_channel text,
    website text,
    rating numeric(3,2) DEFAULT 0,
    reviews_count integer DEFAULT 0,
    channel_post_id integer,
    partner_type public.partner_type DEFAULT 'free',
    status public.partner_status DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Таблица: partner_application_categories
CREATE TABLE public.partner_application_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid REFERENCES public.partner_applications(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(application_id, category_id)
);

-- Таблица: partner_profile_categories
CREATE TABLE public.partner_profile_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(profile_id, category_id)
);

-- Таблица: orders
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id bigint,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    budget numeric(10,2),
    city text,
    contact text,
    status public.request_status DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Таблица: questions
CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id bigint,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    text text NOT NULL,
    details text,
    status public.request_status DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Таблица: partner_post_comments
CREATE TABLE public.partner_post_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_profile_id uuid REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    channel_post_id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id bigint,
    username text,
    text text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(channel_post_id, comment_id)
);

-- Индексы
CREATE INDEX idx_partner_applications_user_id ON public.partner_applications(user_id);
CREATE INDEX idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX idx_partner_profiles_status ON public.partner_profiles(status);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_questions_user_id ON public.questions(user_id);
CREATE INDEX idx_questions_status ON public.questions(status);

-- RLS (Row Level Security) - отключаем для упрощения
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_application_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profile_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_post_comments DISABLE ROW LEVEL SECURITY;

-- Данные: settings (начальные настройки)
INSERT INTO public.settings (key, value, description) VALUES
('telegram_bot_token', '8423349734:AAGaTfgF7GhikunPZ9VwnngPKSrRqz5hcLI', 'Telegram Bot Token'),
('telegram_channel_id', '@av_rekomenduet', 'Telegram Channel ID'),
('app_name', 'Sweet Style Saver', 'Application Name'),
('admin_email', 'admin@ayvazyan-rekomenduet.ru', 'Admin Email')
ON CONFLICT (key) DO NOTHING;

-- Завершено
