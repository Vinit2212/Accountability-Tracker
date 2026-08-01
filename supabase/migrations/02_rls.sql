-- ==========================================
-- LUMNICORE ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Security Definer helper function to securely check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users view own profile or admins view all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- prevents changing own role
  );

-- ----------------------------------------------------
-- DAILY CHECKINS POLICIES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users view own checkins or admins view all" ON public.daily_checkins;
CREATE POLICY "Users view own checkins or admins view all" ON public.daily_checkins
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own checkins" ON public.daily_checkins;
CREATE POLICY "Users insert own checkins" ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own checkins" ON public.daily_checkins;
CREATE POLICY "Users update own checkins" ON public.daily_checkins
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: Admins are not granted UPDATE or DELETE permissions on checkins, preserving read-only audit capability.
