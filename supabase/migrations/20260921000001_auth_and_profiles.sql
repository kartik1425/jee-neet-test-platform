-- Phase 1 Migration: Auth Profiles & Role Based Access Control
-- Run this in your Supabase SQL Editor

-- 1. Create Role Enum
CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE public.target_exam_type AS ENUM ('JEE_MAIN', 'JEE_ADV', 'NEET');

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'STUDENT',
  target_exam public.target_exam_type DEFAULT 'JEE_MAIN',
  target_year INTEGER DEFAULT 2026,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Get Current User Role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 6. RLS Policies for Profiles
-- A. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- B. Teachers and Admins can view all profiles (e.g. students and classes)
CREATE POLICY "Teachers and Admins can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    public.get_current_user_role() IN ('TEACHER', 'ADMIN')
  );

-- C. Users can update their own profile (name, target exam) but CANNOT change their role
CREATE POLICY "Users can update own non-role profile fields"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Role cannot be altered by normal user
  );

-- D. Admins can update any profile including role assignments
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR ALL
  USING (
    public.get_current_user_role() = 'ADMIN'
  );

-- 7. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'STUDENT';
BEGIN
  -- Safe default: always create STUDENT unless created via admin service_role metadata
  INSERT INTO public.profiles (id, email, full_name, role, target_exam)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student User'),
    assigned_role,
    COALESCE((new.raw_user_meta_data->>'target_exam')::public.target_exam_type, 'JEE_MAIN')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
