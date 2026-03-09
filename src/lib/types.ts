export type EncounterType = 'coffee' | 'call' | 'event' | 'dm' | 'bumped';

export type BuddyMood = 'idle' | 'listening' | 'happy' | 'thinking' | 'sleepy';

export interface Person {
  id: string;
  name: string;
  city?: string;
  context?: string;
  first_met_date?: string;
  created_at: string;
}

export interface Encounter {
  id: string;
  person_id: string;
  person_name: string;
  type: EncounterType;
  date: string;
  time: string;
  summary: string;
  full_text?: string;
  energy?: number;  // 0-100
  category?: 'work' | 'personal' | 'social';
  source?: 'voice' | 'text' | 'paste';
  raw_transcript?: string;
  created_at: string;
}

export interface Note {
  id: string;
  person_id: string;
  text: string;
  created_at: string;
}

export interface Action {
  id: string;
  person_id: string;
  encounter_id?: string;
  text: string;
  done: boolean;
  created_at: string;
}

export interface PersonLink {
  id: string;
  person_id: string;
  url: string;
  title: string;
  source: string;
  summary: string;
  created_at: string;
}
