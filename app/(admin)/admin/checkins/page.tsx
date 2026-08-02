'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/navbar';
import { DEMO_USERS, DEMO_ADMIN_PROFILE, generateDemoCheckins } from '@/lib/mockData';
import { Profile, DailyCheckin } from '@/lib/types';
import { generateCheckinsCSV, CheckinWithProfile } from '@/lib/csv';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { useRouter } from 'next/navigation';

export default function AdminCheckinsPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<Profile>(DEMO_ADMIN_PROFILE);
  const [checkinsWithProfiles, setCheckinsWithProfiles] = useState<CheckinWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'perfect' | 'qualified' | 'missed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadCheckinsData() {
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

        // Fetch from Supabase
        const { data: dbCheckins } = await supabase
          .from('daily_checkins')
          .select('*, profiles(*)')
          .order('checkin_date', { ascending: false });

        let list: CheckinWithProfile[] = (dbCheckins as CheckinWithProfile[]) || [];

        // Merge with local storage checkins & session
        if (typeof window !== 'undefined') {
          let currentUserProf: Profile = activeAdminProfile;
          const sess = localStorage.getItem('lumnicore_session');
          if (sess) {
            try {
              const parsed = JSON.parse(sess);
              if (parsed.user) currentUserProf = parsed.user;
            } catch {}
          }

          const localCheckinsStr = localStorage.getItem('lumnicore_checkins');
          if (localCheckinsStr) {
            try {
              const localCheckins: DailyCheckin[] = JSON.parse(localCheckinsStr);
              localCheckins.forEach((lc) => {
                if (!list.some((c) => c.user_id === lc.user_id && c.checkin_date === lc.checkin_date)) {
                  list.push({
                    ...lc,
                    profiles: currentUserProf,
                  });
                }
              });
            } catch {}
          }
        }

        if (list.length === 0) {
          DEMO_USERS.forEach((u) => {
            const userCheckins = generateDemoCheckins(u.id);
            userCheckins.forEach((c) => {
              list.push({ ...c, profiles: u });
            });
          });
        }

        list.sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime());
        setCheckinsWithProfiles(list);
      } catch (err) {
        console.error('Error fetching global checkins:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCheckinsData();
  }, []);

  // Filtered Checkins
  const filteredCheckins = useMemo(() => {
    let result = [...checkinsWithProfiles];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.profiles?.full_name?.toLowerCase().includes(term) ||
          c.profiles?.email?.toLowerCase().includes(term) ||
          c.checkin_date.includes(term)
      );
    }

    // Date range filter
    const now = new Date();
    if (dateFilter === '7days') {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      result = result.filter((c) => new Date(c.checkin_date) >= d);
    } else if (dateFilter === '30days') {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      result = result.filter((c) => new Date(c.checkin_date) >= d);
    }

    // Score filter
    if (scoreFilter === 'perfect') {
      result = result.filter((c) => c.daily_score === 100);
    } else if (scoreFilter === 'qualified') {
      result = result.filter((c) => c.daily_score >= 80);
    } else if (scoreFilter === 'missed') {
      result = result.filter((c) => c.daily_score < 80);
    }

    return result;
  }, [checkinsWithProfiles, searchTerm, dateFilter, scoreFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCheckins.length / itemsPerPage) || 1;
  const paginatedCheckins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCheckins.slice(start, start + itemsPerPage);
  }, [filteredCheckins, currentPage]);

  // CSV Export Trigger
  const handleExportCSV = () => {
    const csvContent = generateCheckinsCSV(filteredCheckins);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lumnicore_checkins_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole="admin" userEmail={currentAdmin.email} userName={currentAdmin.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & CSV Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-sky-400" />
              All Registered User Check-ins
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Global check-in audit table with filtering and CSV export
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-lg text-xs shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Filtered Data to CSV ({filteredCheckins.length})</span>
          </button>
        </div>

        {/* Filters bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search user name or email..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e: any) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Time</option>
                <option value="7days" className="bg-slate-900">Last 7 Days</option>
                <option value="30days" className="bg-slate-900">Last 30 Days</option>
              </select>
            </div>

            {/* Score Filter */}
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={scoreFilter}
                onChange={(e: any) => { setScoreFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Scores</option>
                <option value="perfect" className="bg-slate-900">Perfect 100%</option>
                <option value="qualified" className="bg-slate-900">Streak Qualified (≥80%)</option>
                <option value="missed" className="bg-slate-900">Missed (&lt;80%)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{filteredCheckins.length}</span> check-ins
          </div>
        </div>

        {/* Global Spreadsheet Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[950px]">
            <thead className="bg-slate-800/80 text-slate-200 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-3">Wake-Up</th>
                <th className="py-3 px-3">Sleep</th>
                <th className="py-3 px-3">Clean Eating</th>
                <th className="py-3 px-3">Gym</th>
                <th className="py-3 px-3">Water (3-4L)</th>
                <th className="py-3 px-3">Focus Hrs</th>
                <th className="py-3 px-3">Mood</th>
                <th className="py-3 px-4">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400 font-sans">
                    Loading check-ins...
                  </td>
                </tr>
              ) : paginatedCheckins.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-500 font-sans">
                    No check-in records found.
                  </td>
                </tr>
              ) : (
                paginatedCheckins.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-100 whitespace-nowrap">{c.checkin_date}</td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-200">{c.profiles?.full_name || 'User'}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{c.profiles?.email || '—'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{c.wake_up_time}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{c.sleep_time}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">{c.ate_clean_status}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      {!c.gym_applicable ? 'Off' : c.gym_completed ? 'Done ✓' : 'Missed ✗'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      {c.water_completed !== false ? '💧 3-4L ✓' : 'Missed ✗'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">{c.focused_hours} h</td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      {c.mood === 'Great' && '🤩 Great'}
                      {c.mood === 'Good' && '🙂 Good'}
                      {c.mood === 'Neutral' && '😐 Neutral'}
                      {c.mood === 'Low' && '😔 Low'}
                      {c.mood === 'Stressed' && '😤 Stressed'}
                      {!c.mood && '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.daily_score === 100
                          ? 'bg-emerald-600 text-white'
                          : c.daily_score >= 80
                          ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {c.daily_score}%
                      </span>
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
      </main>
    </div>
  );
}
