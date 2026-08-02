'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Link from 'next/link';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Target, 
  Award, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { DailyCheckin, Profile } from '@/lib/types';
import { generateDemoCheckins, DEMO_USER_PROFILE } from '@/lib/mockData';
import { calculateStreaks, calculateMostMissedTask } from '@/lib/scoring';
import { getISTDateString } from '@/lib/timezone';
import ProgressCharts from '@/components/charts/progress-charts';

import { createClient } from '@/lib/supabase/client';

export default function UserDashboard() {
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profData) setProfile(profData);

          const { data: userCheckins } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', user.id)
            .order('checkin_date', { ascending: false });

          if (userCheckins) {
            setCheckins(userCheckins as DailyCheckin[]);
          } else {
            setCheckins([]);
          }
          let activeProf = profile;
          if (typeof window !== 'undefined') {
            const sess = localStorage.getItem('lumnicore_session');
            if (sess) {
              try {
                const parsed = JSON.parse(sess);
                if (parsed.user) {
                  activeProf = parsed.user;
                  setProfile(parsed.user);
                }
              } catch {}
            }
            const localCheckinsStr = localStorage.getItem('lumnicore_checkins');
            if (localCheckinsStr) {
              try {
                const allLocal: DailyCheckin[] = JSON.parse(localCheckinsStr);
                setCheckins(allLocal.filter((c) => c.user_id === activeProf.id));
              } catch {
                setCheckins([]);
              }
            } else {
              setCheckins([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setCheckins([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const todayStr = getISTDateString();
  const todayEntry = checkins.find((c) => c.checkin_date === todayStr);

  // Compute Streak
  const { currentStreak, longestStreak } = calculateStreaks(checkins, todayStr);

  // Weekly Completion %
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyCheckins = checkins.filter((c) => new Date(c.checkin_date) >= sevenDaysAgo);
  const weeklyAvgScore = weeklyCheckins.length
    ? Math.round(weeklyCheckins.reduce((acc, c) => acc + c.daily_score, 0) / weeklyCheckins.length)
    : 0;

  // Monthly Completion % & Perfect Days
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCheckins = checkins.filter((c) => new Date(c.checkin_date) >= firstOfMonth);
  const monthlyAvgScore = monthlyCheckins.length
    ? Math.round(monthlyCheckins.reduce((acc, c) => acc + c.daily_score, 0) / monthlyCheckins.length)
    : 0;
  const perfectDaysMonth = monthlyCheckins.filter((c) => c.daily_score === 100).length;

  // Total focused hours this week
  const totalFocusedHrsWeek = weeklyCheckins.reduce((acc, c) => acc + Number(c.focused_hours || 0), 0);

  // Most missed task
  const mostMissed = calculateMostMissedTask(checkins);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole={profile.role} userEmail={profile.email} userName={profile.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header & Today Status Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100">
              Welcome back, {profile.full_name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Date: <span className="text-slate-200 font-semibold">{todayStr}</span> (Asia/Kolkata)
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {todayEntry ? (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold">Today's Check-in Complete</div>
                  <div className="text-xs text-emerald-400/80">Score: {todayEntry.daily_score}%</div>
                </div>
                <Link
                  href="/today"
                  className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
            ) : (
              <Link
                href="/today"
                className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md text-sm"
              >
                <span>Submit Today's Check-in</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* 8 Compact Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. Current Streak */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Current Streak</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">{currentStreak} <span className="text-xs font-normal text-slate-400">days</span></div>
          </div>

          {/* 2. Longest Streak */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Longest Streak</span>
              <Award className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-sky-400">{longestStreak} <span className="text-xs font-normal text-slate-400">days</span></div>
          </div>

          {/* 3. Weekly Avg */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Weekly Completion</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{weeklyAvgScore}%</div>
          </div>

          {/* 4. Monthly Avg */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Monthly Completion</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-400">{monthlyAvgScore}%</div>
          </div>

          {/* 5. Perfect Days */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Perfect Days (100%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">{perfectDaysMonth} <span className="text-xs font-normal text-slate-400">days</span></div>
          </div>

          {/* 6. Total Focus Hrs */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Weekly Focus Hrs</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400">{totalFocusedHrsWeek} <span className="text-xs font-normal text-slate-400">hrs</span></div>
          </div>
        </div>

        {/* Most Missed Task Warning Card */}
        {mostMissed !== 'None' && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between text-amber-300 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Most Frequently Missed Task: <strong className="text-slate-100">{mostMissed}</strong></span>
            </div>
            <Link href="/progress" className="text-xs font-semibold text-amber-400 hover:underline">
              View Detailed Analytics →
            </Link>
          </div>
        )}

        {/* Progress Visual Charts Component */}
        <ProgressCharts checkins={checkins.slice(0, 14)} />
      </main>
    </div>
  );
}
