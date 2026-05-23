import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing. Forms will not persist data.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
export const submitContact = async (data) => {
  const { error } = await supabase.from('contacts').insert([{
    name: data.name,
    email: data.email,
    company: data.company || null,
    service: data.service || null,
    message: data.message,
  }]);
  if (error) throw error;
};

// ─── JOB APPLICATIONS ────────────────────────────────────────────────────────
export const submitApplication = async (data) => {
  const { error } = await supabase.from('applications').insert([{
    name: data.name,
    email: data.email,
    job_title: data.jobTitle || null,
    message: data.message || null,
  }]);
  if (error) throw error;
};

// ─── HEALTH CHECKS (lead capture) ────────────────────────────────────────────
export const saveHealthCheck = async (data) => {
  const { error } = await supabase.from('health_checks').insert([{
    email: data.email || null,
    score: data.score,
    grade: data.grade,
    answers: data.answers,
    result: data.result,
  }]);
  if (error) console.warn('Health check save failed (non-blocking):', error);
};

// ─── JOBS (read public listings) ─────────────────────────────────────────────
export const fetchJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};
