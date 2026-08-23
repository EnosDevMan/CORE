export interface DailyWorkingHours {
  open: string;
  close: string;
  closed?: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface WorkingHours {
  open: string;
  close: string;
  daysOpen: number[];
  breakStart?: string;
  breakEnd?: string;
  /** Per-day schedule; optional for compatibility with persisted configurations. */
  weeklySchedule?: Partial<Record<number, DailyWorkingHours>>;
}
