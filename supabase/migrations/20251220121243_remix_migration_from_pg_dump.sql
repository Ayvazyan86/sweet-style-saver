CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator'
);


--
-- Name: application_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.application_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: field_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.field_type AS ENUM (
    'string',
    'text',
    'number',
    'phone',
    'url',
    'select'
);


--
-- Name: partner_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.partner_status AS ENUM (
    'active',
    'inactive',
    'archived'
);


--
-- Name: partner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.partner_type AS ENUM (
    'star',
    'paid',
    'free'
);


--
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'awaiting_partners',
    'active',
    'expired'
);


--
-- Name: get_profile_by_telegram_id(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profile_by_telegram_id(_telegram_id bigint) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.profiles WHERE telegram_id = _telegram_id LIMIT 1
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: notify_application_moderation_result(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_application_moderation_result() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_new_partner_application(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_new_partner_application() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_partners_new_order(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_partners_new_order() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_partners_new_question(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_partners_new_question() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_en text,
    slug text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: channel_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channel_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    subscribers_count integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: custom_field_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_field_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    label_en text,
    field_type public.field_type DEFAULT 'string'::public.field_type NOT NULL,
    is_required boolean DEFAULT false,
    is_active boolean DEFAULT true,
    placeholder text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: custom_field_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_field_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_profile_id uuid NOT NULL,
    field_definition_id uuid NOT NULL,
    value text
);


--
-- Name: moderation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    moderator_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notification_errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_errors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    error_type text NOT NULL,
    partner_profile_id uuid,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    error_message text,
    resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_errors_entity_type_check CHECK ((entity_type = ANY (ARRAY['order'::text, 'question'::text])))
);


--
-- Name: order_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: order_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    partner_profile_id uuid NOT NULL,
    message_id bigint,
    published_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    text text NOT NULL,
    city text,
    budget text,
    contact text,
    status public.request_status DEFAULT 'pending'::public.request_status,
    rejection_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    actuality_confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text
);


--
-- Name: partner_application_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_application_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: partner_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    age integer,
    profession text,
    city text,
    agency_name text,
    agency_description text,
    self_description text,
    phone text,
    tg_channel text,
    website text,
    youtube text,
    office_address text,
    status public.application_status DEFAULT 'pending'::public.application_status,
    rejection_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    photo_url text
);


--
-- Name: partner_edit_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_edit_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_profile_id uuid NOT NULL,
    changes jsonb NOT NULL,
    status public.application_status DEFAULT 'pending'::public.application_status,
    rejection_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: partner_profile_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_profile_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: partner_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    application_id uuid,
    name text NOT NULL,
    age integer,
    profession text,
    city text,
    agency_name text,
    agency_description text,
    self_description text,
    phone text,
    tg_channel text,
    website text,
    youtube text,
    office_address text,
    status public.partner_status DEFAULT 'active'::public.partner_status,
    partner_type public.partner_type DEFAULT 'free'::public.partner_type,
    is_recommended boolean DEFAULT false,
    paid_until timestamp with time zone,
    channel_post_id bigint,
    discussion_message_id bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_profile_id uuid NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'RUB'::text,
    telegram_payment_id text,
    status text DEFAULT 'pending'::text,
    period_days integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    telegram_id bigint NOT NULL,
    username text,
    first_name text,
    last_name text,
    language_code text DEFAULT 'ru'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: question_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: question_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    partner_profile_id uuid NOT NULL,
    message_id bigint,
    published_at timestamp with time zone DEFAULT now()
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    text text NOT NULL,
    details text,
    status public.request_status DEFAULT 'pending'::public.request_status,
    rejection_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    actuality_confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: channel_stats channel_stats_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_stats
    ADD CONSTRAINT channel_stats_date_key UNIQUE (date);


--
-- Name: channel_stats channel_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_stats
    ADD CONSTRAINT channel_stats_pkey PRIMARY KEY (id);


--
-- Name: custom_field_definitions custom_field_definitions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_key_key UNIQUE (key);


--
-- Name: custom_field_definitions custom_field_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_pkey PRIMARY KEY (id);


--
-- Name: custom_field_values custom_field_values_partner_profile_id_field_definition_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_partner_profile_id_field_definition_id_key UNIQUE (partner_profile_id, field_definition_id);


--
-- Name: custom_field_values custom_field_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_pkey PRIMARY KEY (id);


--
-- Name: moderation_logs moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_pkey PRIMARY KEY (id);


--
-- Name: notification_errors notification_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_errors
    ADD CONSTRAINT notification_errors_pkey PRIMARY KEY (id);


--
-- Name: order_categories order_categories_order_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_categories
    ADD CONSTRAINT order_categories_order_id_category_id_key UNIQUE (order_id, category_id);


--
-- Name: order_categories order_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_categories
    ADD CONSTRAINT order_categories_pkey PRIMARY KEY (id);


--
-- Name: order_publications order_publications_order_id_partner_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_publications
    ADD CONSTRAINT order_publications_order_id_partner_profile_id_key UNIQUE (order_id, partner_profile_id);


--
-- Name: order_publications order_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_publications
    ADD CONSTRAINT order_publications_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: partner_application_categories partner_application_categories_application_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_application_categories
    ADD CONSTRAINT partner_application_categories_application_id_category_id_key UNIQUE (application_id, category_id);


--
-- Name: partner_application_categories partner_application_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_application_categories
    ADD CONSTRAINT partner_application_categories_pkey PRIMARY KEY (id);


--
-- Name: partner_applications partner_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_pkey PRIMARY KEY (id);


--
-- Name: partner_edit_requests partner_edit_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_edit_requests
    ADD CONSTRAINT partner_edit_requests_pkey PRIMARY KEY (id);


--
-- Name: partner_profile_categories partner_profile_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profile_categories
    ADD CONSTRAINT partner_profile_categories_pkey PRIMARY KEY (id);


--
-- Name: partner_profile_categories partner_profile_categories_profile_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profile_categories
    ADD CONSTRAINT partner_profile_categories_profile_id_category_id_key UNIQUE (profile_id, category_id);


--
-- Name: partner_profiles partner_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profiles
    ADD CONSTRAINT partner_profiles_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_telegram_id_key UNIQUE (telegram_id);


--
-- Name: question_categories question_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_pkey PRIMARY KEY (id);


--
-- Name: question_categories question_categories_question_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_question_id_category_id_key UNIQUE (question_id, category_id);


--
-- Name: question_publications question_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_publications
    ADD CONSTRAINT question_publications_pkey PRIMARY KEY (id);


--
-- Name: question_publications question_publications_question_id_partner_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_publications
    ADD CONSTRAINT question_publications_question_id_partner_profile_id_key UNIQUE (question_id, partner_profile_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_notification_errors_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_errors_entity ON public.notification_errors USING btree (entity_type, entity_id);


--
-- Name: idx_notification_errors_partner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_errors_partner ON public.notification_errors USING btree (partner_profile_id);


--
-- Name: idx_notification_errors_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_errors_resolved ON public.notification_errors USING btree (resolved);


--
-- Name: idx_orders_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_category_id ON public.orders USING btree (category_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_partner_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_applications_status ON public.partner_applications USING btree (status);


--
-- Name: idx_partner_applications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_applications_user_id ON public.partner_applications USING btree (user_id);


--
-- Name: idx_partner_profiles_paid_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_profiles_paid_until ON public.partner_profiles USING btree (paid_until);


--
-- Name: idx_partner_profiles_partner_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_profiles_partner_type ON public.partner_profiles USING btree (partner_type);


--
-- Name: idx_partner_profiles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_profiles_status ON public.partner_profiles USING btree (status);


--
-- Name: idx_profiles_telegram_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_telegram_id ON public.profiles USING btree (telegram_id);


--
-- Name: idx_questions_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_category_id ON public.questions USING btree (category_id);


--
-- Name: idx_questions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_status ON public.questions USING btree (status);


--
-- Name: partner_applications on_application_moderation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_application_moderation AFTER UPDATE ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION public.notify_application_moderation_result();


--
-- Name: orders on_new_order_notify_partners; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_order_notify_partners AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_partners_new_order();


--
-- Name: partner_applications on_new_partner_application; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_partner_application AFTER INSERT ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION public.notify_new_partner_application();


--
-- Name: questions on_new_question_notify_partners; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_question_notify_partners AFTER INSERT ON public.questions FOR EACH ROW EXECUTE FUNCTION public.notify_partners_new_question();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_field_definitions update_custom_field_definitions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_field_definitions_updated_at BEFORE UPDATE ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: partner_applications update_partner_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: partner_profiles update_partner_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_partner_profiles_updated_at BEFORE UPDATE ON public.partner_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: questions update_questions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_field_values custom_field_values_field_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_field_definition_id_fkey FOREIGN KEY (field_definition_id) REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE;


--
-- Name: custom_field_values custom_field_values_partner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_partner_profile_id_fkey FOREIGN KEY (partner_profile_id) REFERENCES public.partner_profiles(id) ON DELETE CASCADE;


--
-- Name: moderation_logs moderation_logs_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.profiles(id);


--
-- Name: notification_errors notification_errors_partner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_errors
    ADD CONSTRAINT notification_errors_partner_profile_id_fkey FOREIGN KEY (partner_profile_id) REFERENCES public.partner_profiles(id) ON DELETE SET NULL;


--
-- Name: order_categories order_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_categories
    ADD CONSTRAINT order_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: order_categories order_categories_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_categories
    ADD CONSTRAINT order_categories_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_publications order_publications_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_publications
    ADD CONSTRAINT order_publications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_publications order_publications_partner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_publications
    ADD CONSTRAINT order_publications_partner_profile_id_fkey FOREIGN KEY (partner_profile_id) REFERENCES public.partner_profiles(id) ON DELETE CASCADE;


--
-- Name: orders orders_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: orders orders_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.profiles(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: partner_application_categories partner_application_categories_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_application_categories
    ADD CONSTRAINT partner_application_categories_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.partner_applications(id) ON DELETE CASCADE;


--
-- Name: partner_application_categories partner_application_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_application_categories
    ADD CONSTRAINT partner_application_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: partner_applications partner_applications_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.profiles(id);


--
-- Name: partner_applications partner_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: partner_edit_requests partner_edit_requests_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_edit_requests
    ADD CONSTRAINT partner_edit_requests_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.profiles(id);


--
-- Name: partner_edit_requests partner_edit_requests_partner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_edit_requests
    ADD CONSTRAINT partner_edit_requests_partner_profile_id_fkey FOREIGN KEY (partner_profile_id) REFERENCES public.partner_profiles(id) ON DELETE CASCADE;


--
-- Name: partner_profile_categories partner_profile_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profile_categories
    ADD CONSTRAINT partner_profile_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: partner_profile_categories partner_profile_categories_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profile_categories
    ADD CONSTRAINT partner_profile_categories_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.partner_profiles(id) ON DELETE CASCADE;


--
-- Name: partner_profiles partner_profiles_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profiles
    ADD CONSTRAINT partner_profiles_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.partner_applications(id);


--
-- Name: partner_profiles partner_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_profiles
    ADD CONSTRAINT partner_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payments payments_partner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_partner_profile_id_fkey FOREIGN KEY (partner_profile_id) REFERENCES public.partner_profiles(id) ON DELETE CASCADE;


--
-- Name: question_categories question_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: question_categories question_categories_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: question_publications question_publications_partner_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_publications
    ADD CONSTRAINT question_publications_partner_profile_id_fkey FOREIGN KEY (partner_profile_id) REFERENCES public.partner_profiles(id) ON DELETE CASCADE;


--
-- Name: question_publications question_publications_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_publications
    ADD CONSTRAINT question_publications_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: questions questions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: questions questions_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.profiles(id);


--
-- Name: questions questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: partner_profiles Active partner profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active partner profiles are viewable by everyone" ON public.partner_profiles FOR SELECT USING ((status = 'active'::public.partner_status));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: custom_field_definitions Admins can manage custom fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage custom fields" ON public.custom_field_definitions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notification_errors Admins can manage notification errors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage notification errors" ON public.notification_errors USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: partner_profiles Admins can manage partner profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage partner profiles" ON public.partner_profiles USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: partner_application_categories Application categories can be created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Application categories can be created" ON public.partner_application_categories FOR INSERT WITH CHECK (true);


--
-- Name: partner_application_categories Application categories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Application categories viewable by everyone" ON public.partner_application_categories FOR SELECT USING (true);


--
-- Name: categories Categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);


--
-- Name: custom_field_values Custom field values viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Custom field values viewable by everyone" ON public.custom_field_values FOR SELECT USING (true);


--
-- Name: custom_field_definitions Custom fields are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Custom fields are viewable by everyone" ON public.custom_field_definitions FOR SELECT USING (true);


--
-- Name: partner_edit_requests Edit requests viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Edit requests viewable by everyone" ON public.partner_edit_requests FOR SELECT USING (true);


--
-- Name: moderation_logs Moderators can insert moderation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can insert moderation logs" ON public.moderation_logs FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: partner_application_categories Moderators can manage application categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage application categories" ON public.partner_application_categories USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: custom_field_values Moderators can manage custom field values; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage custom field values" ON public.custom_field_values USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: order_categories Moderators can manage order categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage order categories" ON public.order_categories USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: order_publications Moderators can manage order publications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage order publications" ON public.order_publications USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: partner_profile_categories Moderators can manage partner profile categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage partner profile categories" ON public.partner_profile_categories USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: question_categories Moderators can manage question categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage question categories" ON public.question_categories USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: question_publications Moderators can manage question publications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage question publications" ON public.question_publications USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: partner_applications Moderators can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can update applications" ON public.partner_applications FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: partner_edit_requests Moderators can update edit requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can update edit requests" ON public.partner_edit_requests FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: orders Moderators can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can update orders" ON public.orders FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: questions Moderators can update questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can update questions" ON public.questions FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: partner_profiles Moderators can view all partner profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can view all partner profiles" ON public.partner_profiles FOR SELECT USING ((public.has_role(auth.uid(), 'moderator'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: channel_stats Only admins can manage channel stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage channel stats" ON public.channel_stats USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: settings Only admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage settings" ON public.settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: channel_stats Only admins can view channel stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view channel stats" ON public.channel_stats FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: moderation_logs Only admins can view moderation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view moderation logs" ON public.moderation_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: settings Only admins can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view settings" ON public.settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: order_categories Order categories can be created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order categories can be created" ON public.order_categories FOR INSERT WITH CHECK (true);


--
-- Name: order_categories Order categories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order categories viewable by everyone" ON public.order_categories FOR SELECT USING (true);


--
-- Name: order_publications Order publications viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order publications viewable by everyone" ON public.order_publications FOR SELECT USING (true);


--
-- Name: orders Orders viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Orders viewable by everyone" ON public.orders FOR SELECT USING (true);


--
-- Name: partner_profile_categories Partner profile categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Partner profile categories are viewable by everyone" ON public.partner_profile_categories FOR SELECT USING (true);


--
-- Name: payments Payments viewable by admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Payments viewable by admins" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: question_categories Question categories can be created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Question categories can be created" ON public.question_categories FOR INSERT WITH CHECK (true);


--
-- Name: question_categories Question categories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Question categories viewable by everyone" ON public.question_categories FOR SELECT USING (true);


--
-- Name: question_publications Question publications viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Question publications viewable by everyone" ON public.question_publications FOR SELECT USING (true);


--
-- Name: questions Questions viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Questions viewable by everyone" ON public.questions FOR SELECT USING (true);


--
-- Name: notification_errors Service role can insert errors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert errors" ON public.notification_errors FOR INSERT WITH CHECK (true);


--
-- Name: payments Service role can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage payments" ON public.payments USING (true);


--
-- Name: profiles Service role can manage profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage profiles" ON public.profiles USING (true);


--
-- Name: user_roles Service role can manage user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage user roles" ON public.user_roles USING (true);


--
-- Name: user_roles User roles viewable by admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User roles viewable by admins" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: partner_applications Users can create applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create applications" ON public.partner_applications FOR INSERT WITH CHECK (true);


--
-- Name: partner_edit_requests Users can create edit requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create edit requests" ON public.partner_edit_requests FOR INSERT WITH CHECK (true);


--
-- Name: orders Users can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: questions Users can create questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create questions" ON public.questions FOR INSERT WITH CHECK (true);


--
-- Name: partner_applications Users can view own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own applications" ON public.partner_applications FOR SELECT USING (true);


--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: channel_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.channel_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_field_definitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_field_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

--
-- Name: moderation_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_errors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_errors ENABLE ROW LEVEL SECURITY;

--
-- Name: order_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: order_publications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_publications ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_application_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_application_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_edit_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_edit_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_profile_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_profile_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: question_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: question_publications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.question_publications ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;