import { calculateCheckinScore } from '../lib/scoring';

describe('Lumnicore Scoring Rules', () => {
  test('Weekday perfect check-in should score 100% (6/6 points)', () => {
    // 2026-08-03 is a Monday (Weekday)
    const result = calculateCheckinScore({
      checkin_date: '2026-08-03',
      wake_up_time: '07:30 AM',
      sleep_time: '11:45 PM',
      ate_clean_status: 'Yes',
      gym_completed: true,
      water_completed: true,
      focused_hours: 6,
    });

    expect(result.wake_up_completed).toBe(true);
    expect(result.sleep_completed).toBe(true);
    expect(result.clean_eating_completed).toBe(true);
    expect(result.clean_eating_points).toBe(1.0);
    expect(result.gym_applicable).toBe(true);
    expect(result.gym_completed).toBe(true);
    expect(result.gym_points).toBe(1.0);
    expect(result.water_completed).toBe(true);
    expect(result.water_points).toBe(1.0);
    expect(result.focus_completed).toBe(true);
    expect(result.completed_points).toBe(6.0);
    expect(result.applicable_points).toBe(6.0);
    expect(result.daily_score).toBe(100);
  });

  test('Weekend perfect check-in should score 100% with 5 applicable points (Gym excluded)', () => {
    // 2026-08-02 is a Sunday (Weekend)
    const result = calculateCheckinScore({
      checkin_date: '2026-08-02',
      wake_up_time: '08:00 AM',
      sleep_time: '12:15 AM', // 12:15 AM is on time
      ate_clean_status: 'Yes',
      gym_completed: false, // optional on weekend
      water_completed: true,
      focused_hours: 5.5,
    });

    expect(result.wake_up_completed).toBe(true);
    expect(result.sleep_completed).toBe(true);
    expect(result.gym_applicable).toBe(false);
    expect(result.gym_points).toBe(0.0);
    expect(result.water_completed).toBe(true);
    expect(result.completed_points).toBe(5.0);
    expect(result.applicable_points).toBe(5.0);
    expect(result.daily_score).toBe(100);
  });

  test('Weekend workout recorded should not add extra points or affect applicable_points', () => {
    // 2026-08-01 is a Saturday
    const result = calculateCheckinScore({
      checkin_date: '2026-08-01',
      wake_up_time: '07:45 AM',
      sleep_time: '12:30 AM', // 12:30 AM on time boundary
      ate_clean_status: 'Yes',
      gym_completed: true, // optional workout done
      water_completed: true,
      focused_hours: 5.0,
    });

    expect(result.gym_applicable).toBe(false);
    expect(result.completed_points).toBe(5.0);
    expect(result.applicable_points).toBe(5.0);
    expect(result.daily_score).toBe(100);
  });

  test('Sleep time after 12:30 AM (e.g. 01:00 AM) should be marked as missed', () => {
    const result = calculateCheckinScore({
      checkin_date: '2026-08-03',
      wake_up_time: '07:00 AM',
      sleep_time: '01:00 AM', // Late sleep
      ate_clean_status: 'Yes',
      gym_completed: true,
      water_completed: true,
      focused_hours: 5,
    });

    expect(result.sleep_completed).toBe(false);
    expect(result.completed_points).toBe(5.0);
    expect(result.applicable_points).toBe(6.0);
    expect(result.daily_score).toBe(83.33);
  });

  test('Clean eating "Mostly" awards 0.5 points', () => {
    const result = calculateCheckinScore({
      checkin_date: '2026-08-03',
      wake_up_time: '07:30 AM',
      sleep_time: '11:30 PM',
      ate_clean_status: 'Mostly',
      gym_completed: true,
      water_completed: true,
      focused_hours: 5,
    });

    expect(result.clean_eating_points).toBe(0.5);
    expect(result.completed_points).toBe(5.5);
    expect(result.applicable_points).toBe(6.0);
    expect(result.daily_score).toBe(91.67);
  });
});
