import { supabase } from "@/integrations/supabase/client";

export interface ExerciseFolder {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  primary_muscle: string | null;
  unit: 'kg' | 'lbs';
  created_at: string;
}

export interface GymSession {
  id: string;
  user_id: string;
  session_index: number;
  scheduled_date: string | null;
  status: 'planned' | 'completed' | 'skipped';
  preset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetEntry {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  timestamp: string;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  stats: {
    last_best_set_value: number | null;
    estimated_1rm: number | null;
    total_volume: number | null;
  };
  history: Array<{
    weight: number;
    reps: number;
    unit: string;
    estimated1RM: number;
    timestamp: string;
    sessionIndex: number;
  }>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Folders API
export async function getFolders(): Promise<ExerciseFolder[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-folders`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch folders');
  }

  return response.json();
}

export async function createFolder(title: string): Promise<ExerciseFolder> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-folders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create folder');
  }

  return response.json();
}

export async function updateFolder(id: string, title: string): Promise<ExerciseFolder> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-folders/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update folder');
  }

  return response.json();
}

export async function deleteFolder(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-folders/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete folder');
  }
}

// Exercises API
export async function getExercises(folderId?: string | null): Promise<Exercise[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = folderId 
    ? `${SUPABASE_URL}/functions/v1/gym-exercises?folderId=${folderId}`
    : `${SUPABASE_URL}/functions/v1/gym-exercises`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch exercises');
  }

  return response.json();
}

export async function createExercise(exercise: {
  name: string;
  folderId?: string | null;
  primaryMuscle?: string;
  unit: 'kg' | 'lbs';
}): Promise<Exercise> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-exercises`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create exercise');
  }

  return response.json();
}

export async function updateExercise(
  id: string,
  exercise: {
    name?: string;
    folderId?: string | null;
    primaryMuscle?: string;
    unit?: 'kg' | 'lbs';
  }
): Promise<Exercise> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-exercises/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update exercise');
  }

  return response.json();
}

export async function deleteExercise(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-exercises/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete exercise');
  }
}

// Sessions API
export async function getSessions(params?: {
  status?: 'planned' | 'completed' | 'skipped';
  presetId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: GymSession[]; total: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.presetId) queryParams.set('presetId', params.presetId);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const url = `${SUPABASE_URL}/functions/v1/gym-sessions${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sessions');
  }

  return response.json();
}

export async function createSession(sessionData: {
  scheduledDate?: string;
  presetId?: string;
  sessionIndex?: number;
}): Promise<GymSession> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }

  return response.json();
}

export async function updateSession(
  id: string,
  updates: {
    status?: 'planned' | 'completed' | 'skipped';
    scheduledDate?: string;
  }
): Promise<GymSession> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-sessions/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update session');
  }

  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-sessions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete session');
  }
}

// Sets API
export async function getSessionSets(sessionId: string): Promise<SetEntry[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-sets/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sets');
  }

  return response.json();
}

export async function addSet(
  sessionId: string,
  setData: {
    exerciseId: string;
    setNumber: number;
    weight: number;
    reps: number;
    unit: 'kg' | 'lbs';
  }
): Promise<SetEntry> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-sets/${sessionId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(setData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add set');
  }

  return response.json();
}

// Stats API
export async function getExerciseStats(exerciseId: string): Promise<ExerciseStats> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gym-stats/${exerciseId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch stats');
  }

  return response.json();
}

// Export API
export async function exportData(params?: {
  exerciseId?: string;
  from?: string;
  to?: string;
  format?: 'json' | 'csv';
}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const queryParams = new URLSearchParams();
  if (params?.exerciseId) queryParams.set('exerciseId', params.exerciseId);
  if (params?.from) queryParams.set('from', params.from);
  if (params?.to) queryParams.set('to', params.to);
  if (params?.format) queryParams.set('format', params.format);

  const url = `${SUPABASE_URL}/functions/v1/gym-export${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to export data');
  }

  if (params?.format === 'csv') {
    return response.text();
  }

  return response.json();
}
