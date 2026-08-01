'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/navbar';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';
import { DEMO_USERS, DEMO_ADMIN_PROFILE, generateDemoCheckins } from '@/lib/mockData';
import { AdminUserSummary, Profile, DailyCheckin } from '@/lib/types';
import { getISTDateString } from '@/lib/timezone';
import { calculateStreaks, calculateMostMissedTask } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const [currentAdmin, setCurrentAdmin] = useState<Profile>(DEMO_ADMIN_PROFILE);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [checkinsList, setCheckinsList] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'missing'>('all');
  const [sortBy, setSortBy] = useState<'weekly_score' | 'streak' | 'focused_hours'>('weekly_score');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function loadAdminData() {
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

          if (adminProf) {
            activeAdminProfile = adminProf as Profile;
          } else {
            activeAdminProfile = {
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
              email: user.email || 'admin@lumnicore.com',
              role: 'admin',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
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

        // Fetch Profiles & Checkins from Supabase
        const { data: dbProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: dbCheckins } = await supabase.from('daily_checkins').select('*').order('checkin_date', { ascending: false });

        let profilesMap = new Map<string, Profile>();
        let checkinsArr: DailyCheckin[] = [];

        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p) => profilesMap.set(p.id, p as Profile));
        }
        if (dbCheckins && dbCheckins.length > 0) {
          checkinsArr = dbCheckins as DailyCheckin[];
        }

        // Also merge local storage profiles/checkins if available
        if (typeof window !== 'undefined') {
          const sess = localStorage.getItem('lumnicore_session');
          if (sess) {
            try {
              const parsed = JSON.parse(sess);
              if (parsed.user && !profilesMap.has(parsed.user.id)) {
                profilesMap.set(parsed.user.id, parsed.user);
              }
            } catch {}
          }
          const localCheckinsStr = localStorage.getItem('lumnicore_checkins');
          if (localCheckinsStr) {
            try {
              const localCheckins: DailyCheckin[] = JSON.parse(localCheckinsStr);
              localCheckins.forEach((lc) => {
                if (!checkinsArr.some((c) => c.user_id === lc.user_id && c.checkin_date === lc.checkin_date)) {
                  checkinsArr.push(lc);
                }
              });
            } catch {}
          }
        }

        // If no profiles registered yet, fallback to DEMO_USERS
        if (profilesMap.size === 0) {
          DEMO_USERS.forEach((u) => profilesMap.set(u.id, u));
          DEMO_USERS.forEach((u) => checkinsArr.push(...generateDemoCheckins(u.id)));
        } else if (!profilesMap.has(activeAdminProfile.id)) {
          profilesMap.set(activeAdminProfile.id, activeAdminProfile);
        }

        setProfilesList(Array.from(profilesMap.values()));
        setCheckinsList(checkinsArr);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  const todayStr = getISTDateString();

  // Compute user summaries across profiles and check-ins
  const userSummaries: AdminUserSummary[] = useMemo(() => {
    return profilesList.map((user) => {
      const userCheckins = checkinsList.filter((c) => c.user_id === user.id);
      const todayEntry = userCheckins.find((c) => c.checkin_date === todayStr);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weeklyCheckins = userCheckins.filter((c) => new Date(c.checkin_date) >= sevenDaysAgo);
      const weeklyScore = weeklyCheckins.length
        ? Math.round(weeklyCheckins.reduce((acc, c) => acc + c.daily_score, 0) / weeklyCheckins.length)
        : 0;

      const focusedHrsWeek = weeklyCheckins.reduce((acc, c) => acc + Number(c.focused_hours || 0), 0);
      const { currentStreak } = calculateStreaks(userCheckins, todayStr);
      const lastEntry = userCheckins[0]?.checkin_date || null;

      return {
        ...user,
        today_checked_in: Boolean(todayEntry),
        today_score: todayEntry ? todayEntry.daily_score : null,
        weekly_score: weeklyScore,
        current_streak: currentStreak,
        focused_hours_this_week: focusedHrsWeek,
        last_checkin_date: lastEntry,
      };
    });
  }, [profilesList, checkinsList, todayStr]);

  // Overall Group Summaries
  const totalUsers = userSummaries.length;
  const activeUsers = userSummaries.filter((u) => u.is_active).length;
  const checkedInToday = userSummaries.filter((u) => u.today_checked_in).length;
  const missingToday = totalUsers - checkedInToday;

  const todayScores = userSummaries.filter((u) => u.today_score !== null).map((u) => u.today_score!);
  const avgGroupScoreToday = todayScores.length
    ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length)
    : 0;

  const avgGroupScoreWeek = Math.round(
    userSummaries.reduce((acc, u) => acc + u.weekly_score, 0) / (totalUsers || 1)
  );

  const totalFocusedHrsWeekGroup = userSummaries.reduce((acc, u) => acc + u.focused_hours_this_week, 0);
  const mostMissedGroupTask = calculateMostMissedTask(checkinsList);

  // Filtered and sorted users table
  const filteredUsers = useMemo(() => {
    let result = userSummaries.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'checked_in' && u.today_checked_in) ||
        (statusFilter === 'missing' && !u.today_checked_in);

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'weekly_score') return b.weekly_score - a.weekly_score;
      if (sortBy === 'streak') return b.current_streak - a.current_streak;
      if (sortBy === 'focused_hours') return b.focused_hours_this_week - a.focused_hours_this_week;
      return 0;
    });

    return result;
  }, [userSummaries, searchTerm, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole="admin" userEmail={currentAdmin.email} userName={currentAdmin.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              Administrator Control Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Group performance tracking, user inspection, and overall discipline analytics
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold">
            ADMIN LEVEL ACCESS
          </span>
        </div>

        {/* 8 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Total Users</div>
            <div className="text-xl font-extrabold text-slate-100">{totalUsers}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Active Users</div>
            <div className="text-xl font-extrabold text-sky-400">{activeUsers}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Checked In Today</div>
            <div className="text-xl font-extrabold text-emerald-400">{checkedInToday}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Not Checked In</div>
            <div className="text-xl font-extrabold text-rose-400">{missingToday}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Avg Score Today</div>
            <div className="text-xl font-extrabold text-emerald-400">{avgGroupScoreToday}%</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Avg Score Week</div>
            <div className="text-xl font-extrabold text-indigo-400">{avgGroupScoreWeek}%</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Group Focus Hrs</div>
            <div className="text-xl font-extrabold text-rose-400">{totalFocusedHrsWeekGroup} h</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Top Missed</div>
            <div className="text-xs font-bold text-amber-400 truncate">{mostMissedGroupTask}</div>
          </div>
        </div>

        {/* Users Table Controls */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Search user by name or email..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Statuses</option>
                  <option value="checked_in" className="bg-slate-900">Checked In Today</option>
                  <option value="missing" className="bg-slate-900">Missing Today</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="weekly_score" className="bg-slate-900">Sort by Weekly Score</option>
                  <option value="streak" className="bg-slate-900">Sort by Streak</option>
                  <option value="focused_hours" className="bg-slate-900">Sort by Focus Hours</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Found <span className="font-semibold text-slate-200">{filteredUsers.length}</span> registered users
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[850px]">
              <tbody className="divide-y divide-slate-800/60 font-sans">
                <tr className="bg-slate-800/80 text-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                  <td className="py-3 px-4">User Details</td>
                  <td className="py-3 px-3">Today Status</td>
                  <td className="py-3 px-3">Today Score</td>
                  <td className="py-3 px-3">Weekly Score</td>
                  <td className="py-3 px-3">Streak</td>
                  <td className="py-3 px-3">Weekly Focus</td>
                  <td className="py-3 px-4 text-right">Action</td>
                </tr>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      Loading registered users...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{user.full_name}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        {user.today_checked_in ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Checked In ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Missing ✗
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-semibold">
                        {user.today_score !== null ? `${user.today_score}%` : '—'}
                      </td>

                      <td className="py-3 px-3 font-bold text-sky-400">
                        {user.weekly_score}%
                      </td>

                      <td className="py-3 px-3 font-bold text-amber-400">
                        {user.current_streak} days
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-200">
                        {user.focused_hours_this_week} hrs
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-semibold text-xs"
                        >
                          <span>View Progress</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <div>Page {currentPage} of {totalPages}</div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
