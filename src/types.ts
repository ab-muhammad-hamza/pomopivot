export const TimerState = {
  Setup: "Setup",
  Running: "Running",
  Completed: "Completed",
} as const;
export type TimerState = (typeof TimerState)[keyof typeof TimerState];

export const TimerMode = {
  Simple: "Simple",
  Pomodoro: "Pomodoro",
} as const;
export type TimerMode = (typeof TimerMode)[keyof typeof TimerMode];

export const PomodoroPhase = {
  Work: "Work",
  Break: "Break",
} as const;
export type PomodoroPhase = (typeof PomodoroPhase)[keyof typeof PomodoroPhase];

export interface TickEvent {
  remaining_seconds: number;
  progress: number;
}

export interface TimerStatus {
  remaining_seconds: number;
  total_seconds: number;
  progress: number;
  is_running: boolean;
}

export interface PersistedSettings {
  last_minutes: number;
  last_seconds: number;
  last_message: string;
  work_completion_message: string;
  break_completion_message: string;
  work_minutes: number;
  work_seconds: number;
  break_minutes: number;
  break_seconds: number;
  window_left: number;
  window_top: number;
  open_at_login: boolean;
  minimize_to_tray: boolean;
}
