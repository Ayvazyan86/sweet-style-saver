-- Полная схема базы данных (из Supabase)
-- Будет применена после экспорта данных

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE app_role AS ENUM ('admin', 'moderator');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE partner_type AS ENUM ('star', 'paid', 'free');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'awaiting_partners', 'active', 'expired');
CREATE TYPE field_type AS ENUM ('string', 'text', 'number', 'phone', 'url', 'select');

-- Tables will be created from Supabase export
-- This file is a placeholder for now
