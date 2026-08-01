'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import { Profile } from '@/lib/types';
import { DEMO_USER_PROFILE } from '@/lib/mockData';
import { User, Lock, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [fullName, setFullName] = useState(DEMO_USER_PROFILE.full_name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [infoMessage, setInfoMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sess = localStorage.getItem('lumnicore_session');
      if (sess) {
        try {
          const parsed = JSON.parse(sess);
          if (parsed.user) {
            setProfile(parsed.user);
            setFullName(parsed.user.full_name);
          }
        } catch {}
      }
    }
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...profile, full_name: fullName };
    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumnicore_session', JSON.stringify({ user: updated }));
    }
    setInfoMessage('Profile name updated successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumnicore_session');
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole={profile.role} userEmail={profile.email} userName={profile.full_name} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-sky-400" />
            User Account & Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage your account information and security</p>
        </div>

        {/* Profile Card & Info Update */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-lg text-white">
                {profile.full_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-base text-slate-100">{profile.full_name}</div>
                <div className="text-xs text-slate-400">{profile.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                profile.role === 'admin'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              }`}>
                {profile.role}
              </span>
            </div>
          </div>

          {infoMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">Email addresses cannot be changed directly.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Joined Date</label>
              <div className="text-xs text-slate-300 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-800">
                {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Update Full Name
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-sky-400" />
            Security & Password
          </h2>

          {passwordMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Log out section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-slate-200">Sign Out of Lumnicore</div>
            <div className="text-xs text-slate-400">End your active session securely on this device</div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}
