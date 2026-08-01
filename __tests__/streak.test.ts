import { calculateStreaks } from '../lib/scoring';
import { DailyCheckin } from '../lib/types';

describe('Lumnicore Streak Rules', () => {
  const dummyCheckin = (date: string, score: number): DailyCheckin => ({
    id: 'test-' + date,
    user_id: 'user-1',
    checkin_date: date,
    wake_up_time: '07:30',
    sleep_time: '23:30',
    ate_clean_status: 'Yes',
    gym_completed: true,
    water_completed: true,
    focused_hours: 6,
    wake_up_completed: true,
    sleep_completed: true,
    clean_eating_completed: true,
    focus_completed: true,
    gym_applicable: true,
    completed_points: 5,
    applicable_points: 5,
    daily_score: score,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  test('Consecutive checkins with score >= 80% build streak', () => {
    const checkins: DailyCheckin[] = [
      dummyCheckin('2026-07-28', 100),
      dummyCheckin('2026-07-29', 90),
      dummyCheckin('2026-07-30', 80),
      dummyCheckin('2026-07-31', 100),
      dummyCheckin('2026-08-01', 85),
    ];

    const streak = calculateStreaks(checkins, '2026-08-01');
    expect(streak.currentStreak).toBe(5);
    expect(streak.longestStreak).toBe(5);
  });

  test('Score below 80% or missing date breaks current streak', () => {
    const checkins: DailyCheckin[] = [
      dummyCheckin('2026-07-28', 100),
      dummyCheckin('2026-07-29', 100),
      dummyCheckin('2026-07-30', 50), // score < 80 breaks streak
      dummyCheckin('2026-07-31', 100),
      dummyCheckin('2026-08-01', 100),
    ];

    const streak = calculateStreaks(checkins, '2026-08-01');
    expect(streak.currentStreak).toBe(2);
    expect(streak.longestStreak).toBe(2);
  });
});
