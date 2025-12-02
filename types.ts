
export type FlowIntensity = 'Light' | 'Medium' | 'Heavy' | 'Spotting';
export type Mood = 'Happy' | 'Sad' | 'Anxious' | 'Irritable' | 'Energetic' | 'Tired' | 'Calm' | 'Mood Swings';
export type PhysicalSymptom = 'Cramps' | 'Headache' | 'Bloating' | 'Acne' | 'Backache' | 'Tender Breasts' | 'Nausea' | 'Insomnia' | 'Cravings';
export type DischargeType = 'Dry' | 'Sticky' | 'Creamy' | 'Egg White' | 'Watery';
export type SexActivity = 'Protected' | 'Unprotected' | 'High Drive' | 'Low Drive' | 'Masturbation' | 'No Sexual Intercourse';

export interface DailyLog {
  date: string; // ISO 8601 YYYY-MM-DD
  flow?: FlowIntensity | null;
  moods: Mood[];
  symptoms: PhysicalSymptom[];
  discharge?: DischargeType | null;
  sex?: SexActivity[];
  notes?: string;
  // New Features
  water?: number; // in cups
  sleep?: number; // in hours
  weight?: number; // in kg/lbs (unit agnostic for now)
  temperature?: number; // BBT
}

export interface Cycle {
  startDate: string; // ISO 8601 YYYY-MM-DD
  endDate?: string; // ISO 8601 YYYY-MM-DD (calculated or manually closed)
  length: number; // in days
}

export interface UserSettings {
  avgCycleLength: number;
  avgPeriodLength: number;
  name: string;
  dob?: string; // ISO 8601 YYYY-MM-DD
  theme: 'light' | 'dark';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
}