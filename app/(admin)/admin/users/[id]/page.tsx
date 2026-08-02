'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DEMO_USERS, DEMO_ADMIN_PROFILE, generateDemoCheckins } from '@/lib/mockData';
import { DailyCheckin, Profile } from '@/lib/types';
import { calculateStreaks } from '@/lib/scoring';
import { getISTDateString } from '@/lib/timezone';
import HistoryTable from '@/components/history-table';
import ProgressCharts from '@/components/charts/progress-charts';
import { ArrowLeft, User, Shield, Flame, Award, TrendingUp, Calendar, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { useRouter } from 'next/navigation';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = (params?.id as string) || '';

  const [currentAdmin, setCurrentAdmin] = useState<Profile>(DEMO_ADMIN_PROFILE);
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [userCheckins, setUserCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let activeAdminProfile = DEMO_ADMIN_PROFILE;
        if (user) {
          const { data: adminProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (adminProf) activeAdminProfile = adminProf as Profile;
        } else if (typeof window !== 'undefined') {
          const sess = localStorage.getItem('lumnicore_session');
          if (sess) {
            try {
              const parsed = JSON.parse(sess);
              if (parsed.user) activeAdminProfile = parsed.user;
            } catch {}
          }
        }
        setCurrentAdmin(activeAdminProfile);

        if (activeAdminProfile.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        // Load profile by id
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (dbProfile) {
          setTargetUser(dbProfile as Profile);

          // Load checkins by user_id
          const { data: dbCheckins } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', userId)
            .order('checkin_date', { ascending: false });

          setUserCheckins((dbCheckins as DailyCheckin[]) || []);
        } else {
          // Fallback to demo user
          const foundDemo = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
          setTargetUser(foundDemo);
          setUserCheckins(generateDemoCheckins(foundDemo.id));
        }
      } catch (err) {
        console.error('Error loading user detail from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar userRole="admin" userEmail={currentAdmin.email} userName={currentAdmin.full_name} />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-400 text-sm">
          Loading user performance profile...
        </main>
      </div>
    );
  }

  if (!targetUser) return null;

  const todayStr = getISTDateString();
  const todayEntry = userCheckins.find((c) => c.checkin_date === todayStr);

  const { currentStreak, longestStreak } = calculateStreaks(userCheckins, todayStr);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyCheckins = userCheckins.filter((c) => new Date(c.checkin_date) >= sevenDaysAgo);
  const weeklyAvgScore = weeklyCheckins.length
    ? Math.round(weeklyCheckins.reduce((acc, c) => acc + c.daily_score, 0) / weeklyCheckins.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole="admin" userEmail={currentAdmin.email} userName={currentAdmin.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users List</span>
          </Link>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-xl text-white">
                {targetUser.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">{targetUser.full_name}</h1>
                <p className="text-xs text-slate-400">{targetUser.email} • Joined {new Date(targetUser.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Read-Only Admin View</span>
            </div>
          </div>
        </div>

        {/* User Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Today Status</div>
            <div className="text-lg font-bold text-slate-100">
              {todayEntry ? (
                <span className="text-emerald-400">Checked In ({todayEntry.daily_score}%)</span>
              ) : (
                <span className="text-rose-400">Pending Check-in</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Weekly Avg Score</div>
            <div className="text-2xl font-extrabold text-sky-400">{weeklyAvgScore}%</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Current Streak</div>
            <div className="text-2xl font-extrabold text-amber-400">{currentStreak} days</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Longest Streak</div>
            <div className="text-2xl font-extrabold text-slate-100">{longestStreak} days</div>
          </div>
        </div>

        {/* User Progress Charts */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Individual User Analytics</h2>
          <ProgressCharts checkins={userCheckins} />
        </div>

        {/* User Complete Checkin History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Complete Historical Records</h2>
          <HistoryTable checkins={userCheckins} />
        </div>
      </main>
    </div>
  );
}
