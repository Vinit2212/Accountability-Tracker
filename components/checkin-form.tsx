'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AteCleanStatus, MoodStatus, CheckinInput, DailyCheckin } from '@/lib/types';
import { calculateCheckinScore } from '@/lib/scoring';
import { getISTDateString, isWeekdayIST } from '@/lib/timezone';
import { Clock, Moon, Utensils, Dumbbell, Flame, Droplet, Smile, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface CheckinFormProps {
  initialData?: DailyCheckin | null;
  onSave: (checkin: CheckinInput) => Promise<void>;
}

const MOOD_OPTIONS: { status: MoodStatus; emoji: string; label: string }[] = [
  { status: 'Great', emoji: '🤩', label: 'Great' },
  { status: 'Good', emoji: '🙂', label: 'Good' },
  { status: 'Neutral', emoji: '😐', label: 'Neutral' },
  { status: 'Low', emoji: '😔', label: 'Low' },
  { status: 'Stressed', emoji: '😤', label: 'Stressed' },
];

function formatTimeStringToHHMM(timeStr?: string | null, fallback: string = '07:30'): string {
  if (!timeStr) return fallback;
  const trimmed = timeStr.trim().toUpperCase();
  if (trimmed.includes('AM') || trimmed.includes('PM')) {
    const isPM = trimmed.includes('PM');
    const isAM = trimmed.includes('AM');
    const cleanStr = trimmed.replace(/(AM|PM)/g, '').trim();
    const parts = cleanStr.split(':');
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    const hh = (parseInt(parts[0], 10) || 0).toString().padStart(2, '0');
    const mm = (parseInt(parts[1], 10) || 0).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return fallback;
}

export default function CheckinForm({ initialData, onSave }: CheckinFormProps) {
  const router = useRouter();
  const todayIST = getISTDateString();
  const isWeekday = isWeekdayIST(todayIST);

  const [wakeUpTime, setWakeUpTime] = useState(
    formatTimeStringToHHMM(initialData?.wake_up_time, '07:30')
  );
  const [sleepTime, setSleepTime] = useState(
    formatTimeStringToHHMM(initialData?.sleep_time, '23:45')
  );
  const [ateCleanStatus, setAteCleanStatus] = useState<AteCleanStatus>(
    (initialData?.ate_clean_status as AteCleanStatus) || 'Yes'
  );
  const [gymCompleted, setGymCompleted] = useState(initialData?.gym_completed ?? (isWeekday ? true : false));
  const [waterCompleted, setWaterCompleted] = useState(initialData?.water_completed ?? true);
  const [focusedHours, setFocusedHours] = useState(initialData?.focused_hours?.toString() || '5.5');
  const [mood, setMood] = useState<MoodStatus>((initialData?.mood as MoodStatus) || 'Great');
  const [dailyNote, setDailyNote] = useState(initialData?.daily_note || '');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Update values if initialData arrives after render
  useEffect(() => {
    if (initialData) {
      if (initialData.wake_up_time) setWakeUpTime(formatTimeStringToHHMM(initialData.wake_up_time, '07:30'));
      if (initialData.sleep_time) setSleepTime(formatTimeStringToHHMM(initialData.sleep_time, '23:45'));
      if (initialData.ate_clean_status) setAteCleanStatus(initialData.ate_clean_status);
      if (initialData.gym_completed !== undefined) setGymCompleted(initialData.gym_completed);
      if (initialData.water_completed !== undefined) setWaterCompleted(initialData.water_completed);
      if (initialData.focused_hours !== undefined) setFocusedHours(initialData.focused_hours.toString());
      if (initialData.mood) setMood(initialData.mood);
      if (initialData.daily_note !== undefined) setDailyNote(initialData.daily_note || '');
    }
  }, [initialData]);

  // Calculate real-time preview score
  const parsedFocusHrs = parseFloat(focusedHours) || 0;
  const scoreResult = calculateCheckinScore({
    checkin_date: todayIST,
    wake_up_time: wakeUpTime,
    sleep_time: sleepTime,
    ate_clean_status: ateCleanStatus,
    gym_completed: gymCompleted,
    water_completed: waterCompleted,
    focused_hours: parsedFocusHrs,
    mood,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (parsedFocusHrs < 0 || parsedFocusHrs > 24) {
      setErrorMessage('Focused hours must be between 0 and 24.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        checkin_date: todayIST,
        wake_up_time: wakeUpTime,
        sleep_time: sleepTime,
        ate_clean_status: ateCleanStatus,
        gym_completed: gymCompleted,
        water_completed: waterCompleted,
        focused_hours: parsedFocusHrs,
        mood,
        daily_note: dailyNote,
      });
      setSuccessMessage('Today’s check-in saved successfully!');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Form Column */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-sky-400" />
            Daily Check-in for {todayIST}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Asia/Kolkata timezone • Submit once daily • Edits allowed until midnight IST
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            {errorMessage}
          </div>
        )}

        {/* 1. Wake Up Time */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" /> 1. Wake-up Time
            </span>
            <span className="text-xs text-slate-400 font-normal">Target: ≤ 08:00 AM</span>
          </label>
          <input
            type="time"
            value={wakeUpTime}
            onChange={(e) => setWakeUpTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>

        {/* 2. Sleep Time */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" /> 2. Sleep Time
            </span>
            <span className="text-xs text-slate-400 font-normal">Target: ≤ 12:30 AM (00:30)</span>
          </label>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>

        {/* 3. Clean Eating */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-400" /> 3. Eat Clean
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Yes', 'Mostly', 'No'] as AteCleanStatus[]).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setAteCleanStatus(status)}
                className={`py-2.5 rounded-lg font-medium text-sm border transition-all ${
                  ateCleanStatus === status
                    ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {status === 'Yes' && 'Yes (1 pt)'}
                {status === 'Mostly' && 'Mostly (0.5 pt)'}
                {status === 'No' && 'No (0 pt)'}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Gym Task */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" /> 4. Gym / Workout
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {isWeekday ? 'Required (Mon-Fri)' : 'Optional (Weekend)'}
            </span>
          </label>
          <label className="flex items-center space-x-3 bg-slate-800 border border-slate-700 p-3 rounded-lg cursor-pointer hover:bg-slate-750">
            <input
              type="checkbox"
              checked={gymCompleted}
              onChange={(e) => setGymCompleted(e.target.checked)}
              className="w-5 h-5 accent-sky-600 rounded"
            />
            <span className="text-sm font-medium text-slate-200">
              Completed Gym / Workout Session Today
            </span>
          </label>
        </div>

        {/* 5. Water Intake */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-400" /> 5. Drink 3–4 Litres of Water
            </span>
            <span className="text-xs text-slate-400 font-normal">Target: 3–4 Litres</span>
          </label>
          <label className="flex items-center space-x-3 bg-slate-800 border border-slate-700 p-3 rounded-lg cursor-pointer hover:bg-slate-750">
            <input
              type="checkbox"
              checked={waterCompleted}
              onChange={(e) => setWaterCompleted(e.target.checked)}
              className="w-5 h-5 accent-cyan-600 rounded"
            />
            <span className="text-sm font-medium text-slate-200">
              Drank 3–4 Litres of Water Today
            </span>
          </label>
        </div>

        {/* 6. Focused Study or Work */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" /> 6. Focused Work / Study Hours
            </span>
            <span className="text-xs text-slate-400 font-normal">Target: ≥ 5.0 hrs</span>
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            max="24"
            value={focusedHours}
            onChange={(e) => setFocusedHours(e.target.value)}
            placeholder="e.g. 5.5"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            required
          />
        </div>

        {/* 7. Mood Tracking with Emojis */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Smile className="w-4 h-4 text-purple-400" /> 7. How was your mood today?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((item) => (
              <button
                type="button"
                key={item.status}
                onClick={() => setMood(item.status)}
                className={`py-2.5 px-1 rounded-lg flex flex-col items-center justify-center border transition-all ${
                  mood === item.status
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500 shadow-sm ring-1 ring-purple-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-[11px] font-medium mt-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Note */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Daily Reflection / Note (Optional)
          </label>
          <textarea
            rows={2}
            value={dailyNote}
            onChange={(e) => setDailyNote(e.target.value)}
            placeholder="Brief reflection on your discipline today..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50 text-sm"
        >
          {submitting ? 'Saving Check-in...' : 'Submit Today’s Check-in'}
        </button>

        {/* Success Message display right below the submit button */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-lg text-sm flex items-center justify-center gap-2 animate-fadeIn font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            {successMessage}
          </div>
        )}
      </form>

      {/* Real-time Calculation Preview Card Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm sticky top-24">
          <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Score Preview</span>
            <span className={`text-2xl font-extrabold ${scoreResult.daily_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {scoreResult.daily_score}%
            </span>
          </h3>

          {/* Points Breakdown */}
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Wake Up (≤ 08:00 AM)</span>
              <span className="font-semibold">
                {scoreResult.wake_up_completed ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 1.0 pt</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> 0.0 pt</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Sleep (≤ 12:30 AM)</span>
              <span className="font-semibold">
                {scoreResult.sleep_completed ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 1.0 pt</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> 0.0 pt</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Clean Eating</span>
              <span className="font-semibold text-slate-200">
                {scoreResult.clean_eating_points} pt ({ateCleanStatus})
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Gym Session</span>
              <span className="font-semibold">
                {!scoreResult.gym_applicable ? (
                  <span className="text-slate-400 italic">Excluded (Weekend)</span>
                ) : scoreResult.gym_completed ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 1.0 pt</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> 0.0 pt</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Water Intake (3–4L)</span>
              <span className="font-semibold">
                {scoreResult.water_completed ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 1.0 pt</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> 0.0 pt</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Focus Hours (≥ 5 hrs)</span>
              <span className="font-semibold">
                {scoreResult.focus_completed ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 1.0 pt</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> 0.0 pt</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Today's Mood</span>
              <span className="font-semibold text-purple-300 flex items-center gap-1">
                {MOOD_OPTIONS.find((m) => m.status === mood)?.emoji} {mood}
              </span>
            </div>

            <div className="pt-3 flex justify-between items-center text-base font-bold text-slate-100">
              <span>Earned / Max Points</span>
              <span className="text-sky-400">
                {scoreResult.completed_points} / {scoreResult.applicable_points} pts
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-slate-800/80 border border-slate-750 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200">Streak Qualification Rule:</div>
            <div>Score ≥ 80% is required to maintain your active daily discipline streak.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
