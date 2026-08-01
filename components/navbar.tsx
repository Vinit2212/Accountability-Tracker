'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  TrendingUp, 
  History, 
  User, 
  ShieldAlert, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface NavbarProps {
  userRole?: UserRole;
  userEmail?: string;
  userName?: string;
}

export default function Navbar({ userRole = 'user', userEmail, userName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = userRole === 'admin';

  const userNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Today', href: '/today', icon: CheckSquare },
    { label: 'My Progress', href: '/progress', icon: TrendingUp },
    { label: 'History', href: '/history', icon: History },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', href: '/admin', icon: ShieldAlert },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Check-ins', href: '/admin/checkins', icon: FileSpreadsheet },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    // Navigate to login after clearing mock session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumnicore_session');
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-md tracking-wider">
                L
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-100 tracking-tight leading-tight">LUMNICORE</span>
                <span className="text-[10px] text-sky-400 font-mono tracking-widest uppercase">Daily Discipline</span>
              </div>
            </Link>

            {isAdmin && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                ADMIN
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 font-semibold border-b-2 border-sky-500'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Badge & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-200">{userName || 'User'}</div>
              <div className="text-xs text-slate-400 truncate max-w-[160px]">{userEmail || 'user@lumnicore.com'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-sky-600/30 text-sky-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-4 border-t border-slate-800 mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">{userName || 'User'}</div>
              <div className="text-xs text-slate-400">{userEmail || 'user@lumnicore.com'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-md border border-rose-500/20"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
