'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/navbar';
import { DEMO_USERS, DEMO_ADMIN_PROFILE, generateDemoCheckins } from '@/lib/mockData';
import { Profile } from '@/lib/types';
import { CheckinWithProfile } from '@/lib/csv';
import { BarChart3, TrendingUp, Users, Flame, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function AdminReportsPage() {
  const [currentAdmin, setCurrentAdmin] = useState<Profile>(DEMO_ADMIN_PROFILE);
  const [groupCheckins, setGroupCheckins] = useState<CheckinWithProfile[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportsData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: adminProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (adminProf) setCurrentAdmin(adminProf);
        }

        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        const { data: dbCheckins } = await supabase.from('daily_checkins').select('*, profiles(*)');

        if (dbCheckins && dbCheckins.length > 0) {
          setGroupCheckins(dbCheckins as CheckinWithProfile[]);
          setProfilesList((dbProfiles as Profile[]) || []);
        } else {
          setProfilesList(DEMO_USERS);
          const demoList: CheckinWithProfile[] = [];
          DEMO_USERS.forEach((u) => {
            const uCheckins = generateDemoCheckins(u.id);
            uCheckins.forEach((c) => {
              demoList.push({ ...c, profiles: u });
            });
          });
          setGroupCheckins(demoList);
        }
      } catch (err) {
        console.error('Error fetching admin reports data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReportsData();
  }, []);

  // Calculate daily average score over time
  const dailyGroupTrend = useMemo(() => {
    const map = new Map<string, number[]>();
    groupCheckins.forEach((c) => {
      if (!map.has(c.checkin_date)) map.set(c.checkin_date, []);
      map.get(c.checkin_date)!.push(c.daily_score);
    });

    const dates = Array.from(map.keys()).sort();
    return dates.map((dStr) => {
      const scores = map.get(dStr)!;
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return {
        date: dStr,
        avg_score: avg,
        participation: scores.length,
      };
    });
  }, [groupCheckins]);

  // Task Completion rates across group
  const total = groupCheckins.length || 1;
  const wakeRate = Math.round((groupCheckins.filter((c) => c.wake_up_completed).length / total) * 100);
  const sleepRate = Math.round((groupCheckins.filter((c) => c.sleep_completed).length / total) * 100);
  const cleanRate = Math.round(
    (groupCheckins.filter((c) => c.ate_clean_status === 'Yes' || c.ate_clean_status === 'Mostly').length / total) * 100
  );
  const gymCheckins = groupCheckins.filter((c) => c.gym_applicable);
  const gymRate = gymCheckins.length
    ? Math.round((gymCheckins.filter((c) => c.gym_completed).length / gymCheckins.length) * 100)
    : 0;
  const waterRate = Math.round((groupCheckins.filter((c) => c.water_completed !== false).length / total) * 100);
  const focusRate = Math.round((groupCheckins.filter((c) => c.focus_completed).length / total) * 100);

  const groupTaskData = [
    { name: 'Wake Up (≤8 AM)', pct: wakeRate, fill: '#0284c7' },
    { name: 'Sleep (≤12:30 AM)', pct: sleepRate, fill: '#6366f1' },
    { name: 'Eat Clean', pct: cleanRate, fill: '#10b981' },
    { name: 'Gym (Weekdays)', pct: gymRate, fill: '#f59e0b' },
    { name: 'Water (3-4L)', pct: waterRate, fill: '#06b6d4' },
    { name: 'Focus (≥5 hrs)', pct: focusRate, fill: '#f43f5e' },
  ];

  // Top Consistent Users
  const userRankings = useMemo(() => {
    const list = profilesList.length > 0 ? profilesList : DEMO_USERS;
    return list.map((u) => {
      const checkins = groupCheckins.filter((c) => c.user_id === u.id);
      const avgScore = checkins.length
        ? Math.round(checkins.reduce((a, b) => a + b.daily_score, 0) / checkins.length)
        : 0;
      const perfectCount = checkins.filter((c) => c.daily_score === 100).length;
      return {
        name: u.full_name,
        email: u.email,
        avgScore,
        perfectCount,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [profilesList, groupCheckins]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole="admin" userEmail={currentAdmin.email} userName={currentAdmin.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            Group Analytical Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate performance trends and task breakdown (Confidential Admin View)
          </p>
        </div>

        {/* Chart 1: Group Average Daily Score over time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Group Average Daily Score (%)</span>
            <span className="text-xs text-slate-400 font-normal">All registered users combined</span>
          </h3>
          <div className="h-64 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Loading reports data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyGroupTrend} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${val}%`, 'Group Avg Score']}
                  />
                  <Line type="monotone" dataKey="avg_score" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 2: Task Completion Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 mb-4">Group Task Completion Rate (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupTaskData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${val}%`, 'Completion']}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {groupTaskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Consistent Users Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Top Consistent Members</span>
              <span className="text-xs text-amber-400 font-normal">Admin View Only</span>
            </h3>

            <div className="space-y-3">
              {userRankings.map((u, idx) => (
                <div key={u.email} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-750 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-5 h-5 rounded-full bg-slate-700 font-bold text-[11px] flex items-center justify-center text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sky-400">{u.avgScore}% Avg Score</div>
                    <div className="text-[11px] text-slate-400">{u.perfectCount} Perfect Days</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
