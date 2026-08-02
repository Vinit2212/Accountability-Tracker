'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { DEMO_USER_PROFILE, DEMO_ADMIN_PROFILE } from '@/lib/mockData';
import { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const supabase = createClient();

      // Attempt Supabase Auth login
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        // If it's explicitly demo user/admin button fill, allow demo bypass
        if (email === 'admin@lumnicore.com' || email === 'user@lumnicore.com') {
          let demoProfile = email === 'admin@lumnicore.com' ? DEMO_ADMIN_PROFILE : DEMO_USER_PROFILE;
          if (typeof window !== 'undefined') {
            localStorage.setItem('lumnicore_session', JSON.stringify({ user: demoProfile }));
          }
          router.push(demoProfile.role === 'admin' ? '/admin' : '/dashboard');
          return;
        }

        // Display real Supabase Auth error for custom registered emails
        throw new Error(authErr.message || 'Invalid email or password.');
      }

      // Fetch logged-in user profile from Supabase profiles table
      let userProfile: Profile = {
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
        email: authData.user.email || email,
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profData) {
        userProfile = profData as any;
      } else {
        // Ensure profile exists in profiles table
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: userProfile.full_name,
          email: userProfile.email,
          role: 'user',
          is_active: true,
        });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('lumnicore_session', JSON.stringify({ user: userProfile }));
      }

      if (userProfile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = () => {
    setEmail('admin@lumnicore.com');
    setPassword('admin123');
  };

  const handleDemoUser = () => {
    setEmail('user@lumnicore.com');
    setPassword('user123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sky-600 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md">
            L
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Log In to Lumnicore</h1>
          <p className="text-xs text-slate-400">Access your daily check-in dashboard</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        {/* Demo Fast Login Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={handleDemoUser}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-lg text-center font-medium"
          >
            Fill Demo User
          </button>
          <button
            type="button"
            onClick={handleDemoAdmin}
            className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-center font-medium"
          >
            Fill Demo Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-sky-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          Don't have an account?{' '}
          <Link href="/signup" className="text-sky-400 font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
