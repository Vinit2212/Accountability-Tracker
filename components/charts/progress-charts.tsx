'use client';

import React from 'react';
import { DailyCheckin } from '@/lib/types';
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

interface ProgressChartsProps {
  checkins: DailyCheckin[];
}

export default function ProgressCharts({ checkins }: ProgressChartsProps) {
  // Sort checkins chronologically for line charts
  const sortedData = [...checkins].sort(
    (a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime()
  );

  // 1. Task Completion Stats Breakdown
  const total = checkins.length || 1;
  const wakeCount = checkins.filter((c) => c.wake_up_completed).length;
  const sleepCount = checkins.filter((c) => c.sleep_completed).length;
  const cleanCount = checkins.filter((c) => c.ate_clean_status === 'Yes' || c.ate_clean_status === 'Mostly').length;
  const gymCheckins = checkins.filter((c) => c.gym_applicable);
  const gymCount = gymCheckins.filter((c) => c.gym_completed).length;
  const focusCount = checkins.filter((c) => c.focus_completed).length;

  const taskCompletionData = [
    { name: 'Wake Up (≤8 AM)', pct: Math.round((wakeCount / total) * 100), fill: '#0284c7' },
    { name: 'Sleep (≤12:30 AM)', pct: Math.round((sleepCount / total) * 100), fill: '#6366f1' },
    { name: 'Eat Clean', pct: Math.round((cleanCount / total) * 100), fill: '#10b981' },
    { name: 'Gym (Weekdays)', pct: gymCheckins.length ? Math.round((gymCount / gymCheckins.length) * 100) : 0, fill: '#f59e0b' },
    { name: 'Focus (≥5 hrs)', pct: Math.round((focusCount / total) * 100), fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-8">
      {/* Chart 1: Daily Score Trend (Line Chart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span>Daily Score Trend (%)</span>
          <span className="text-xs text-slate-400 font-normal">Requirement: ≥ 80% for streak</span>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="checkin_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(val: any) => [`${val}%`, 'Score']}
              />
              <Line
                type="monotone"
                dataKey="daily_score"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0284c7' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 2: Completion Rate by Task (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-100 mb-4">Completion Rate by Task (%)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val}%`, 'Completion']}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {taskCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Focused Hours Trend (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Focused Study / Work Hours</span>
            <span className="text-xs text-slate-400 font-normal">Target: 5.0 hrs</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="checkin_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 12]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} hrs`, 'Focused Time']}
                />
                <Bar dataKey="focused_hours" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
