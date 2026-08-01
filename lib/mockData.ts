import { DailyCheckin, Profile, AteCleanStatus } from './types';
import { getISTDateString, isWeekdayIST } from './timezone';
import { calculateCheckinScore, calculateStreaks } from './scoring';

export const DEMO_USER_PROFILE: Profile = {
  id: 'usr-1111-2222-3333-4444',
  full_name: 'Vinit Bhanushali',
  email: 'user@lumnicore.com',
  role: 'user',
  is_active: true,
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
};

export const DEMO_ADMIN_PROFILE: Profile = {
  id: 'adm-9999-8888-7777-6666',
  full_name: 'System Administrator',
  email: 'admin@lumnicore.com',
  role: 'admin',
  is_active: true,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

export const DEMO_USERS: Profile[] = [
  DEMO_USER_PROFILE,
  {
    id: 'usr-2222-3333-4444-5555',
    full_name: 'Aarav Sharma',
    email: 'aarav@example.com',
    role: 'user',
    is_active: true,
    created_at: '2026-07-10T00:00:00Z',
    updated_at: '2026-07-10T00:00:00Z',
  },
  {
    id: 'usr-3333-4444-5555-6666',
    full_name: 'Priya Patel',
    email: 'priya@example.com',
    role: 'user',
    is_active: true,
    created_at: '2026-07-15T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
  },
];

/**
 * Generate 30 days of realistic sample checkin records for demo user
 */
export function generateDemoCheckins(userId: string = DEMO_USER_PROFILE.id): DailyCheckin[] {
  const checkins: DailyCheckin[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // Format YYYY-MM-DD
    const dateStr = d.toISOString().split('T')[0];
    const isWeekday = isWeekdayIST(dateStr);

    // Realistic variation
    const wakeUpTimes = ['07:15 AM', '07:45 AM', '08:00 AM', '08:20 AM', '07:30 AM'];
    const sleepTimes = ['11:30 PM', '12:15 AM', '12:00 AM', '01:15 AM', '11:45 PM'];
    const cleanStatuses: AteCleanStatus[] = ['Yes', 'Yes', 'Mostly', 'Yes', 'No'];

    const wakeTime = wakeUpTimes[i % wakeUpTimes.length];
    const sleepTime = sleepTimes[i % sleepTimes.length];
    const cleanStatus = cleanStatuses[i % cleanStatuses.length];
    const gymDone = isWeekday ? (i % 5 !== 1) : false;
    const waterDone = i % 8 !== 2;
    const focusHrs = i % 7 === 0 ? 4.0 : i % 4 === 0 ? 6.5 : 5.5;

    const score = calculateCheckinScore({
      checkin_date: dateStr,
      wake_up_time: wakeTime,
      sleep_time: sleepTime,
      ate_clean_status: cleanStatus,
      gym_completed: gymDone,
      water_completed: waterDone,
      focused_hours: focusHrs,
    });

    checkins.push({
      id: `checkin-${userId}-${dateStr}`,
      user_id: userId,
      checkin_date: dateStr,
      wake_up_time: wakeTime,
      sleep_time: sleepTime,
      ate_clean_status: cleanStatus,
      gym_completed: gymDone,
      water_completed: waterDone,
      focused_hours: focusHrs,
      daily_note: i % 3 === 0 ? 'Good focus session today and solid workout.' : undefined,
      wake_up_completed: score.wake_up_completed,
      sleep_completed: score.sleep_completed,
      clean_eating_completed: score.clean_eating_completed,
      focus_completed: score.focus_completed,
      gym_applicable: score.gym_applicable,
      completed_points: score.completed_points,
      applicable_points: score.applicable_points,
      daily_score: score.daily_score,
      created_at: `${dateStr}T20:30:00Z`,
      updated_at: `${dateStr}T20:30:00Z`,
    });
  }

  return checkins;
}
