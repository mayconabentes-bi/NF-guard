import { supabase } from './supabase';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  const unitId = localStorage.getItem('nexus_current_unit_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(unitId ? { 'x-unit-id': unitId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
