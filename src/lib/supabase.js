import { createClient } from '@supabase/supabase-js';

// Defensive: if VITE_SUPABASE_URL was pasted as the full REST URL
// (…supabase.co/rest/v1), the client doubles it to …/rest/v1/rest/v1/ and every
// request 404s. Strip any trailing /rest/v1 and trailing slashes so we always
// pass the clean project URL (…supabase.co).
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
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
// Uploads the CV to the private "cvs" bucket, then saves the full candidate row.
export const submitApplication = async (data) => {
  let cv_path = null;

  if (data.cvFile) {
    const ext = (data.cvFile.name.split('.').pop() || 'pdf').toLowerCase();
    const mimeByExt = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const safeName = data.cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cv_path = `${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(cv_path, data.cvFile, {
        contentType: mimeByExt[ext] || data.cvFile.type || 'application/octet-stream',
        upsert: false,
      });
    if (uploadError) throw uploadError;
  }

  const { error } = await supabase.from('applications').insert([{
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    job_title: data.jobTitle || data.position || null,
    linkedin: data.linkedin || null,
    current_title: data.currentTitle || null,
    current_company: data.currentCompany || null,
    seniority: data.seniority || null,
    location: data.location || null,
    message: data.message || null,
    cv_path,
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
