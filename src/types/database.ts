// Re-export database types
export type { Database } from '../lib/supabase/types';

// Additional application-wide types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface Subscription {
  planType: 'free' | 'pro' | 'unlimited';
  status: string;
  currentPeriodEnd: string | null;
}

export interface OCRUsage {
  todayScans: number;
  scanDate: string;
}
