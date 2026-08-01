-- Migration 03: Add Mood tracking column to daily_checkins
ALTER TABLE public.daily_checkins 
ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('Great', 'Good', 'Neutral', 'Low', 'Stressed'));
