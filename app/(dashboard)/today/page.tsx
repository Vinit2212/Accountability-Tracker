'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import CheckinForm from '@/components/checkin-form';
import { DailyCheckin, CheckinInput, Profile } from '@/lib/types';
import { generateDemoCheckins, DEMO_USER_PROFILE } from '@/lib/mockData';
import { getISTDateString } from '@/lib/timezone';
import { calculateCheckinScore } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/client';

export default function TodayCheckinPage() {
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [todayData, setTodayData] = useState<DailyCheckin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodayData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Load Profile
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profData) setProfile(profData);

          // Load Today's Checkin from Supabase
          const todayStr = getISTDateString();
          const { data: existing, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', user.id)
            .eq('checkin_date', todayStr)
            .maybeSingle();

          if (existing) {
            setTodayData(existing as DailyCheckin);
          }
        } else {
          // Fallback for demo session in local storage
          let activeProfile = profile;
          const sess = localStorage.getItem('lumnicore_session');
          if (sess) {
            try {
              const parsed = JSON.parse(sess);
              if (parsed.user) {
                activeProfile = parsed.user;
                setProfile(parsed.user);
              }
            } catch {}
          }
          const todayStr = getISTDateString();
          const localCheckinsStr = localStorage.getItem('lumnicore_checkins');
          if (localCheckinsStr) {
            try {
              const localCheckins: DailyCheckin[] = JSON.parse(localCheckinsStr);
              const found = localCheckins.find((c) => c.user_id === activeProfile.id && c.checkin_date === todayStr);
              if (found) setTodayData(found);
            } catch {}
          }
        }
      } catch (err) {
        console.error('Failed to load today check-in state:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTodayData();
  }, []);

  const handleSave = async (input: CheckinInput) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user ? user.id : profile.id;
    const todayStr = input.checkin_date || getISTDateString();
    const score = calculateCheckinScore(input);

    const payload = {
      user_id: userId,
      checkin_date: todayStr,
      wake_up_time: input.wake_up_time,
      sleep_time: input.sleep_time,
      ate_clean_status: input.ate_clean_status,
      gym_completed: input.gym_completed,
      water_completed: input.water_completed,
      focused_hours: input.focused_hours,
      mood: input.mood || 'Great',
      daily_note: input.daily_note || null,
      wake_up_completed: score.wake_up_completed,
      sleep_completed: score.sleep_completed,
      clean_eating_completed: score.clean_eating_completed,
      focus_completed: score.focus_completed,
      gym_applicable: score.gym_applicable,
      completed_points: score.completed_points,
      applicable_points: score.applicable_points,
      daily_score: score.daily_score,
      updated_at: new Date().toISOString(),
    };

    if (user) {
      const { data, error } = await supabase
        .from('daily_checkins')
        .upsert(payload, { onConflict: 'user_id,checkin_date' })
        .select()
        .single();

      if (error) {
        console.error('Error saving checkin to Supabase:', error);
        throw new Error(error.message || 'Failed to save check-in to database.');
      }

      setTodayData(data as DailyCheckin);
    } else {
      const newRecord: DailyCheckin = {
        id: `checkin-${userId}-${todayStr}`,
        ...payload,
        created_at: new Date().toISOString(),
      };
      setTodayData(newRecord);
      
      const localCheckinsStr = localStorage.getItem('lumnicore_checkins');
      let localCheckins: DailyCheckin[] = [];
      if (localCheckinsStr) {
        try {
          localCheckins = JSON.parse(localCheckinsStr);
        } catch {}
      }
      const filtered = localCheckins.filter((c) => !(c.user_id === userId && c.checkin_date === todayStr));
      localStorage.setItem('lumnicore_checkins', JSON.stringify([...filtered, newRecord]));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole={profile.role} userEmail={profile.email} userName={profile.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 font-medium">
            Loading today's check-in...
          </div>
        ) : (
          <CheckinForm initialData={todayData} onSave={handleSave} />
        )}
      </main>
    </div>
  );
}
