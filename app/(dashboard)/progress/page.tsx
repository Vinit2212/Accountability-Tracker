'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/navbar';
import { DailyCheckin, Profile } from '@/lib/types';
import { DEMO_USER_PROFILE } from '@/lib/mockData';
import { calculateStreaks, calculateMostMissedTask } from '@/lib/scoring';
import { getISTDateString } from '@/lib/timezone';
import ProgressCharts from '@/components/charts/progress-charts';
import { createClient } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  Flame, 
  Award, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Target, 
  AlertTriangle,
  Zap
} from 'lucide-react';

export default function MyProgressPage() {
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'7days' | '30days' | 'month' | 'all'>('30days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgressData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profData) setProfile(profData as Profile);

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
        console.error('Error loading progress data:', err);
        setCheckins([]);
      } finally {
        setLoading(false);
      }
    }

    loadProgressData();
  }, []);

  const todayStr = getISTDateString();
  const { currentStreak, longestStreak } = calculateStreaks(checkins, todayStr);

  // Filtered checkins by date period
  const filteredCheckins = useMemo(() => {
    const now = new Date();
    if (filterPeriod === '7days') {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      return checkins.filter((c) => new Date(c.checkin_date) >= d);
    }
    if (filterPeriod === '30days') {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      return checkins.filter((c) => new Date(c.checkin_date) >= d);
    }
    if (filterPeriod === 'month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return checkins.filter((c) => new Date(c.checkin_date) >= firstOfMonth);
    }
    return checkins;
  }, [checkins, filterPeriod]);

  // Metrics
  const hasCheckins = filteredCheckins.length > 0;
  const total = filteredCheckins.length;
  const overallAvgScore = hasCheckins
    ? Math.round(filteredCheckins.reduce((acc, c) => acc + c.daily_score, 0) / total)
    : 0;
  const perfectDaysCount = filteredCheckins.filter((c) => c.daily_score === 100).length;
  const avgFocusHrs = hasCheckins
    ? (filteredCheckins.reduce((acc, c) => acc + Number(c.focused_hours || 0), 0) / total).toFixed(1)
    : '0.0';

  const mostMissed = hasCheckins ? calculateMostMissedTask(filteredCheckins) : 'None';

  // Strongest task
  let strongestTask = 'None';
  if (hasCheckins) {
    const wakeRate = filteredCheckins.filter((c) => c.wake_up_completed).length / total;
    const sleepRate = filteredCheckins.filter((c) => c.sleep_completed).length / total;
    const cleanRate = filteredCheckins.filter((c) => c.ate_clean_status === 'Yes').length / total;

    strongestTask = 'Wake Up';
    let maxRate = wakeRate;
    if (sleepRate > maxRate) { strongestTask = 'Sleep'; maxRate = sleepRate; }
    if (cleanRate > maxRate) { strongestTask = 'Clean Eating'; maxRate = cleanRate; }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole={profile.role} userEmail={profile.email} userName={profile.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-sky-400" />
              My Discipline Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Visual performance metrics and consistency tracking
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['7days', '30days', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  filterPeriod === p
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p === '7days' && 'Last 7 Days'}
                {p === '30days' && 'Last 30 Days'}
                {p === 'month' && 'This Month'}
                {p === 'all' && 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Top Analytics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Overall Score</span>
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-extrabold text-sky-400">{overallAvgScore}%</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Current Streak</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-amber-400">{currentStreak} d</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Longest Streak</span>
              <Award className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-100">{longestStreak} d</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Perfect Days</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-emerald-400">{perfectDaysCount}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Avg Focus Hrs</span>
              <Clock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-extrabold text-rose-400">{avgFocusHrs} h</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Strongest Task</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400 truncate">{strongestTask}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Most Missed</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-sm font-bold text-rose-400 truncate">{mostMissed}</div>
          </div>
        </div>

        {/* Charts Component */}
        <ProgressCharts checkins={filteredCheckins} />
      </main>
    </div>
  );
}
