-- Migration 04: Add Water Intake tracking column to daily_checkins
ALTER TABLE public.daily_checkins 
ADD COLUMN IF NOT EXISTS water_completed BOOLEAN NOT NULL DEFAULT true;
