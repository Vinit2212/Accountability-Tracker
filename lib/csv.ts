import { DailyCheckin, Profile } from './types';

export interface CheckinWithProfile extends DailyCheckin {
  profiles?: Partial<Profile> | null;
}

export function generateCheckinsCSV(checkins: CheckinWithProfile[]): string {
  const headers = [
    'Date',
    'User Name',
    'Email',
    'Wake-up Time',
    'Wake-up Result',
    'Sleep Time',
    'Sleep Result',
    'Clean Eating',
    'Gym Completed',
    'Gym Applicable',
    'Focused Hours',
    'Daily Score (%)',
    'Submitted Time',
    'Daily Note',
  ];

  const rows = checkins.map((c) => {
    const userName = c.profiles?.full_name || 'N/A';
    const email = c.profiles?.email || 'N/A';
    const wakeResult = c.wake_up_completed ? 'Completed' : 'Missed';
    const sleepResult = c.sleep_completed ? 'Completed' : 'Missed';
    const gymResult = !c.gym_applicable ? 'N/A (Weekend)' : c.gym_completed ? 'Completed' : 'Missed';
    const note = (c.daily_note || '').replace(/"/g, '""');

    return [
      c.checkin_date,
      `"${userName}"`,
      `"${email}"`,
      c.wake_up_time,
      wakeResult,
      c.sleep_time,
      sleepResult,
      c.ate_clean_status,
      gymResult,
      c.gym_applicable ? 'Yes' : 'No',
      c.focused_hours,
      c.daily_score,
      c.created_at,
      `"${note}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
