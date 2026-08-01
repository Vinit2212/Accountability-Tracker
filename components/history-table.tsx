'use client';

import React, { useState, useMemo } from 'react';
import { DailyCheckin } from '@/lib/types';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Edit3, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';

interface HistoryTableProps {
  checkins: DailyCheckin[];
  onEditToday?: () => void;
}

export default function HistoryTable({ checkins, onEditToday }: HistoryTableProps) {
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | 'month'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'perfect' | 'qualified' | 'missed'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtering & Sorting Logic
  const filteredCheckins = useMemo(() => {
    let result = [...checkins];

    // Date range filter
    const now = new Date();
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      result = result.filter((c) => new Date(c.checkin_date) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      result = result.filter((c) => new Date(c.checkin_date) >= thirtyDaysAgo);
    } else if (dateFilter === 'month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((c) => new Date(c.checkin_date) >= firstOfMonth);
    }

    // Score filter
    if (scoreFilter === 'perfect') {
      result = result.filter((c) => c.daily_score === 100);
    } else if (scoreFilter === 'qualified') {
      result = result.filter((c) => c.daily_score >= 80);
    } else if (scoreFilter === 'missed') {
      result = result.filter((c) => c.daily_score < 80);
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.checkin_date).getTime();
      const dateB = new Date(b.checkin_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [checkins, dateFilter, scoreFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCheckins.length / itemsPerPage) || 1;
  const paginatedCheckins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCheckins.slice(start, start + itemsPerPage);
  }, [filteredCheckins, currentPage]);

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e: any) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All History</option>
              <option value="7days" className="bg-slate-900">Last 7 Days</option>
              <option value="30days" className="bg-slate-900">Last 30 Days</option>
              <option value="month" className="bg-slate-900">This Month</option>
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

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300 font-medium transition-colors"
          >
            Date: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-200">{filteredCheckins.length}</span> check-in records
        </div>
      </div>

      {/* Spreadsheet Table (Horizontally Scrollable) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[900px]">
          <thead className="bg-slate-800/80 text-slate-200 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-3">Wake-Up</th>
              <th className="py-3 px-3">Sleep</th>
              <th className="py-3 px-3">Clean Eating</th>
              <th className="py-3 px-3">Gym</th>
              <th className="py-3 px-3">Water (3-4L)</th>
              <th className="py-3 px-3">Focus Hrs</th>
              <th className="py-3 px-3">Mood</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Daily Note</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedCheckins.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-500 font-sans">
                  No check-in records found for selected filters.
                </td>
              </tr>
            ) : (
              paginatedCheckins.map((c) => {
                const isPerfect = c.daily_score === 100;
                const isQualified = c.daily_score >= 80;

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isPerfect ? 'bg-emerald-500/5' : !isQualified ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3 px-4 font-sans font-semibold text-slate-100 whitespace-nowrap">
                      {c.checkin_date}
                      {isPerfect && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-sans border border-emerald-500/30">
                          PERFECT
                        </span>
                      )}
                    </td>

                    {/* Wake Up */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.wake_up_time}{' '}
                      {c.wake_up_completed ? (
                        <span className="text-emerald-400 font-sans font-bold">✓</span>
                      ) : (
                        <span className="text-rose-400 font-sans font-bold">✗</span>
                      )}
                    </td>

                    {/* Sleep */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.sleep_time}{' '}
                      {c.sleep_completed ? (
                        <span className="text-emerald-400 font-sans font-bold">✓</span>
                      ) : (
                        <span className="text-rose-400 font-sans font-bold">✗</span>
                      )}
                    </td>

                    {/* Clean Eating */}
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        c.ate_clean_status === 'Yes'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.ate_clean_status === 'Mostly'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {c.ate_clean_status}
                      </span>
                    </td>

                    {/* Gym */}
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      {!c.gym_applicable ? (
                        <span className="text-slate-500 italic">Off (Weekend)</span>
                      ) : c.gym_completed ? (
                        <span className="text-emerald-400 font-semibold">Done ✓</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Missed ✗</span>
                      )}
                    </td>

                    {/* Water */}
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      {c.water_completed !== false ? (
                        <span className="text-cyan-400 font-semibold">💧 3-4L ✓</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Missed ✗</span>
                      )}
                    </td>

                    {/* Focus Hours */}
                    <td className="py-3 px-3 whitespace-nowrap font-sans font-medium text-slate-200">
                      {c.focused_hours} hrs
                    </td>

                    {/* Mood */}
                    <td className="py-3 px-3 whitespace-nowrap font-sans text-sm">
                      {c.mood === 'Great' && '🤩 Great'}
                      {c.mood === 'Good' && '🙂 Good'}
                      {c.mood === 'Neutral' && '😐 Neutral'}
                      {c.mood === 'Low' && '😔 Low'}
                      {c.mood === 'Stressed' && '😤 Stressed'}
                      {!c.mood && '—'}
                    </td>

                    {/* Daily Score */}
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        isPerfect
                          ? 'bg-emerald-600 text-white'
                          : isQualified
                          ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {c.daily_score}%
                      </span>
                    </td>

                    {/* Daily Note */}
                    <td className="py-3 px-4 max-w-[200px] truncate font-sans text-slate-400">
                      {c.daily_note || '—'}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right font-sans whitespace-nowrap">
                      <Link
                        href="/today"
                        className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-semibold text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-750"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-750"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
