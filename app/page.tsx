import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckSquare, ShieldCheck, Flame, Award, Calendar } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-md">
              L
            </div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">LUMNICORE</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Start Tracking
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold uppercase tracking-wider mb-6">
          <ShieldCheck className="w-4 h-4" /> Personal Daily Accountability Tracker
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight max-w-3xl">
          Build discipline, one day at a time.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
          Track your daily routine, measure your consistency, and build a stronger record of following through.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-md"
          >
            <span>Start Tracking Today</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold px-8 py-3.5 rounded-xl text-base border border-slate-700 transition-colors"
          >
            <span>Log In to Account</span>
          </Link>
        </div>

        {/* Compact Preview Card of Daily Tasks & Checklist */}
        <div className="mt-16 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-left shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-sky-400" />
                Standard Daily Discipline Tasks
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Fixed core rules for every registered member</p>
            </div>
            <div className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              Daily Target: ≥ 80% Score
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">1. Wake up by 8:00 AM</div>
                <div className="text-xs text-slate-400">Target: ≤ 8:00 AM</div>
              </div>
              <span className="text-sky-400 font-bold">1 Point</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">2. Sleep by 12:30 AM</div>
                <div className="text-xs text-slate-400">Target: ≤ 12:30 AM</div>
              </div>
              <span className="text-indigo-400 font-bold">1 Point</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">3. Eat Clean</div>
                <div className="text-xs text-slate-400">Home-cooked, protein, limited junk</div>
              </div>
              <span className="text-emerald-400 font-bold">Up to 1 Pt</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">4. Go to Gym (Mon-Fri)</div>
                <div className="text-xs text-slate-400">Weekdays required, weekends optional</div>
              </div>
              <span className="text-amber-400 font-bold">1 Point</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-xl flex items-center justify-between md:col-span-2">
              <div>
                <div className="font-semibold text-slate-200">5. Focused Work or Study (≥ 5 Hours)</div>
                <div className="text-xs text-slate-400">Decimal hours tracking</div>
              </div>
              <span className="text-rose-400 font-bold">1 Point</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        Lumnicore Daily Discipline & Accountability Tracker • Asia/Kolkata Timezone
      </footer>
    </div>
  );
}
