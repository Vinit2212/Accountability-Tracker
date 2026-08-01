export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AteCleanStatus = 'Yes' | 'Mostly' | 'No';
export type MoodStatus = 'Great' | 'Good' | 'Neutral' | 'Low' | 'Stressed';

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string; // YYYY-MM-DD in Asia/Kolkata
  wake_up_time: string; // HH:mm (24hr or 12hr)
  sleep_time: string;   // HH:mm (24hr or 12hr)
  ate_clean_status: AteCleanStatus;
  gym_completed: boolean;
  water_completed: boolean;
  focused_hours: number;
  mood?: MoodStatus | null;
  daily_note?: string | null;
  wake_up_completed: boolean;
  sleep_completed: boolean;
  clean_eating_completed: boolean;
  focus_completed: boolean;
  gym_applicable: boolean;
  completed_points: number;
  applicable_points: number;
  daily_score: number;
  created_at: string;
  updated_at: string;
}

export interface CheckinInput {
  wake_up_time: string;
  sleep_time: string;
  ate_clean_status: AteCleanStatus;
  gym_completed: boolean;
  water_completed: boolean;
  focused_hours: number;
  mood?: MoodStatus;
  daily_note?: string;
  checkin_date?: string; // defaults to today in Asia/Kolkata
}

export interface ScoringResult {
  wake_up_completed: boolean;
  sleep_completed: boolean;
  clean_eating_completed: boolean;
  clean_eating_points: number;
  gym_applicable: boolean;
  gym_completed: boolean;
  gym_points: number;
  water_completed: boolean;
  water_points: number;
  focus_completed: boolean;
  focus_points: number;
  completed_points: number;
  applicable_points: number;
  daily_score: number;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  weeklyScorePct: number;
  monthlyScorePct: number;
  perfectDaysThisMonth: number;
  totalFocusedHoursThisWeek: number;
  mostMissedTask: string;
  overallScorePct: number;
  totalCheckins: number;
}

export interface AdminUserSummary extends Profile {
  today_checked_in: boolean;
  today_score: number | null;
  weekly_score: number;
  current_streak: number;
  focused_hours_this_week: number;
  last_checkin_date: string | null;
}
