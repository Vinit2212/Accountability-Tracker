import { AteCleanStatus, CheckinInput, DailyCheckin, ScoringResult } from './types';
import { getISTDateString, isWeekdayIST, parseTimeToMinutes } from './timezone';

/**
 * Validates and calculates scoring metrics for a daily checkin input
 */
export function calculateCheckinScore(input: CheckinInput): ScoringResult {
  const checkinDate = input.checkin_date || getISTDateString();
  const isWeekday = isWeekdayIST(checkinDate);

  // 1. Wake-up task (Completed if <= 8:00 AM / 480 minutes)
  const wakeMins = parseTimeToMinutes(input.wake_up_time);
  const wake_up_completed = wakeMins <= 480;

  // 2. Sleep task (Completed if slept by 12:30 AM / 00:30)
  // Bedtime ranges: 19:00 (7 PM) - 23:59 OR 00:00 - 00:30 (12:30 AM)
  const sleepMins = parseTimeToMinutes(input.sleep_time);
  const isNightBedtime = sleepMins >= 1140; // >= 19:00 PM
  const isEarlyMorningOnTime = sleepMins <= 30; // <= 00:30 AM
  const sleep_completed = isNightBedtime || isEarlyMorningOnTime;

  // 3. Clean eating task (Yes = 1, Mostly = 0.5, No = 0)
  let clean_eating_points = 0;
  if (input.ate_clean_status === 'Yes') clean_eating_points = 1.0;
  else if (input.ate_clean_status === 'Mostly') clean_eating_points = 0.5;
  const clean_eating_completed = input.ate_clean_status !== 'No';

  // 4. Gym task (Applicable Mon-Fri only)
  const gym_applicable = isWeekday;
  const gym_completed = Boolean(input.gym_completed);
  const gym_points = gym_applicable && gym_completed ? 1.0 : 0.0;

  // 5. Focus task (Completed if >= 5.0 hours)
  const focused_hours = Math.min(24, Math.max(0, Number(input.focused_hours) || 0));
  const focus_completed = focused_hours >= 5.0;
  const focus_points = focus_completed ? 1.0 : 0.0;

  // 6. Water intake task (3-4L target = 1 pt)
  const water_completed = input.water_completed !== undefined ? Boolean(input.water_completed) : true;
  const water_points = water_completed ? 1.0 : 0.0;

  // Calculate Totals
  const completed_points = 
    (wake_up_completed ? 1.0 : 0.0) +
    (sleep_completed ? 1.0 : 0.0) +
    clean_eating_points +
    gym_points +
    focus_points +
    water_points;

  const applicable_points = gym_applicable ? 6.0 : 5.0;
  const daily_score = Math.round((completed_points / applicable_points) * 100 * 100) / 100;

  return {
    wake_up_completed,
    sleep_completed,
    clean_eating_completed,
    clean_eating_points,
    gym_applicable,
    gym_completed,
    gym_points,
    water_completed,
    water_points,
    focus_completed,
    focus_points,
    completed_points,
    applicable_points,
    daily_score,
  };
}

/**
 * Calculates current and longest streaks from checkin records (Asia/Kolkata timezone)
 * Rule: Streak counts consecutive calendar days with a checkin AND score >= 80%.
 * Missing day breaks the streak.
 */
export function calculateStreaks(checkins: DailyCheckin[], referenceDateStr?: string) {
  if (!checkins || checkins.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Map checkins by date YYYY-MM-DD
  const checkinMap = new Map<string, DailyCheckin>();
  checkins.forEach((c) => checkinMap.set(c.checkin_date, c));

  const todayStr = referenceDateStr || getISTDateString();
  
  // Calculate longest streak across all history
  const dates = Array.from(checkinMap.keys()).sort();
  let longestStreak = 0;
  let currentRunning = 0;
  let prevDate: Date | null = null;

  for (const dStr of dates) {
    const checkin = checkinMap.get(dStr)!;
    const isSuccess = checkin.daily_score >= 80;
    const currDate = new Date(dStr);

    if (isSuccess) {
      if (prevDate) {
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          currentRunning += 1;
        } else {
          currentRunning = 1;
        }
      } else {
        currentRunning = 1;
      }
      if (currentRunning > longestStreak) {
        longestStreak = currentRunning;
      }
      prevDate = currDate;
    } else {
      currentRunning = 0;
      prevDate = null;
    }
  }

  // Calculate current active streak ending today or yesterday
  let currentStreak = 0;
  let cursor = new Date(todayStr);

  // Check if today has a successful checkin
  let cursorStr = getISTDateString(cursor);
  let todayCheckin = checkinMap.get(cursorStr);

  if (!todayCheckin || todayCheckin.daily_score < 80) {
    // If today hasn't been checked in yet (or missed), check if yesterday was successful
    cursor.setDate(cursor.getDate() - 1);
    cursorStr = getISTDateString(cursor);
  }

  // Count backwards day-by-day
  while (true) {
    const c = checkinMap.get(cursorStr);
    if (c && c.daily_score >= 80) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
      cursorStr = getISTDateString(cursor);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}

/**
 * Identify the most frequently missed task from a list of checkins
 */
export function calculateMostMissedTask(checkins: DailyCheckin[]): string {
  if (!checkins || checkins.length === 0) return 'None';

  const misses = {
    'Wake Up (by 8:00 AM)': 0,
    'Sleep (by 12:30 AM)': 0,
    'Clean Eating': 0,
    'Gym (Weekdays)': 0,
    'Focus Hours (>= 5 hrs)': 0,
    'Water Intake (3-4L)': 0,
  };

  checkins.forEach((c) => {
    if (!c.wake_up_completed) misses['Wake Up (by 8:00 AM)'] += 1;
    if (!c.sleep_completed) misses['Sleep (by 12:30 AM)'] += 1;
    if (c.ate_clean_status === 'No') misses['Clean Eating'] += 1;
    if (c.gym_applicable && !c.gym_completed) misses['Gym (Weekdays)'] += 1;
    if (!c.focus_completed) misses['Focus Hours (>= 5 hrs)'] += 1;
    if (!c.water_completed) misses['Water Intake (3-4L)'] += 1;
  });

  let topTask = 'None';
  let maxMisses = 0;
  for (const [task, count] of Object.entries(misses)) {
    if (count > maxMisses) {
      maxMisses = count;
      topTask = task;
    }
  }

  return maxMisses > 0 ? topTask : 'None';
}
