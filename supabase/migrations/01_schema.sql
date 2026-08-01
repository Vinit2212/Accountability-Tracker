-- ==========================================
-- LUMNICORE DATABASE SCHEMA MIGRATION 01
-- ==========================================

-- 1. Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Daily Checkins Table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  wake_up_time TIME NOT NULL,
  sleep_time TIME NOT NULL,
  ate_clean_status TEXT NOT NULL CHECK (ate_clean_status IN ('Yes', 'Mostly', 'No')),
  gym_completed BOOLEAN NOT NULL DEFAULT false,
  water_completed BOOLEAN NOT NULL DEFAULT true,
  focused_hours NUMERIC(4, 2) NOT NULL CHECK (focused_hours >= 0 AND focused_hours <= 24),
  mood TEXT CHECK (mood IN ('Great', 'Good', 'Neutral', 'Low', 'Stressed')),
  daily_note TEXT,
  wake_up_completed BOOLEAN NOT NULL,
  sleep_completed BOOLEAN NOT NULL,
  clean_eating_completed BOOLEAN NOT NULL,
  focus_completed BOOLEAN NOT NULL,
  gym_applicable BOOLEAN NOT NULL,
  completed_points NUMERIC(3, 1) NOT NULL,
  applicable_points NUMERIC(3, 1) NOT NULL,
  daily_score NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_checkin_date UNIQUE (user_id, checkin_date)
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins(checkin_date DESC);

-- Automatic handle for new user signup -> creates profile record automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Lumnicore User'),
    NEW.email,
    'user',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger firing after user signup in Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
