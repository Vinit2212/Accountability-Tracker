'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import HistoryTable from '@/components/history-table';
import { DailyCheckin, Profile } from '@/lib/types';
import { generateDemoCheckins, DEMO_USER_PROFILE } from '@/lib/mockData';
import { FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function HistoryPage() {
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistoryData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profData) setProfile(profData);

          const { data: userCheckins } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', user.id)
            .order('checkin_date', { ascending: false });

          if (userCheckins) {
            setCheckins(userCheckins as DailyCheckin[]);
          } else {
            setCheckins([]);
          }
        } else {
          if (typeof window !== 'undefined') {
            const sess = localStorage.getItem('lumnicore_session');
            if (sess) {
              try {
                const parsed = JSON.parse(sess);
                if (parsed.user) setProfile(parsed.user);
              } catch {}
            }
            const localCheckinsStr = localStorage.getItem('lumnicore_checkins');
            if (localCheckinsStr) {
              try {
                setCheckins(JSON.parse(localCheckinsStr));
              } catch {
                setCheckins([]);
              }
            } else {
              setCheckins([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching history data:', err);
        setCheckins([]);
      } finally {
        setLoading(false);
      }
    }

    loadHistoryData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar userRole={profile.role} userEmail={profile.email} userName={profile.full_name} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-400" />
            Check-in History Table
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spreadsheet view of all historical check-in submissions
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            Loading check-in history...
          </div>
        ) : (
          <HistoryTable checkins={checkins} />
        )}
      </main>
    </div>
  );
}
